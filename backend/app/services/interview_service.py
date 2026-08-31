from sqlalchemy.orm import Session

from app.config import settings
from app.models.candidate import Candidate
from app.models.session import InterviewSession
from app.models.qa import Question, Answer
from app.ai_pipeline.resume_parser import flatten_skills
from app.ai_pipeline.query_builder import build_queries
from app.ai_pipeline.retriever import retrieve_for_queries
from app.ai_pipeline.question_generator import generate_questions, generate_followup_question


def start_interview(db: Session, candidate_id: str, role: str) -> tuple[InterviewSession, Question]:
    candidate = db.get(Candidate, candidate_id)
    if candidate is None:
        raise ValueError(f"No candidate found with id {candidate_id}")

    session = InterviewSession(candidate_id=candidate_id, role=role, status="in_progress")
    db.add(session)
    db.commit()
    db.refresh(session)

    flat_skills = flatten_skills(candidate.extracted_skills or {})
    queries = build_queries(role, flat_skills)
    chunks = retrieve_for_queries(role, queries)

    if not chunks:
        raise RuntimeError(
            f"No knowledge base content retrieved for role '{role}'. "
            f"Has the knowledge base been ingested for this role?"
        )

    # Store retrieved chunks on the session context for later adaptive follow-ups.
    _CHUNK_CACHE[session.id] = chunks

    generated = generate_questions(
        role=role,
        chunks=chunks,
        candidate_skills=flat_skills,
        n_questions=settings.questions_per_session,
    )

    # Persist only the first question now; remaining ones are generated adaptively
    # as answers come in (keeps the interview responsive to the candidate).
    first = generated[0]
    question = Question(
        session_id=session.id,
        text=first["text"],
        topic=first.get("topic"),
        difficulty=first.get("difficulty"),
        source_chunk_ids=first.get("source_chunk_ids", []),
        generated_from_skill=first.get("generated_from_skill"),
        order_index=0,
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    # Cache the rest of the pre-generated batch for this session.
    _PREGEN_CACHE[session.id] = generated[1:]

    return session, question


# In-memory caches keyed by session_id. Fine for a single-process dev deployment;
# for production, move this into Redis or a session-scoped DB table.
_CHUNK_CACHE: dict[str, list[dict]] = {}
_PREGEN_CACHE: dict[str, list[dict]] = {}


def submit_answer(db: Session, question_id: str, answer_text: str) -> tuple[str, Question | None]:
    """
    Stores the answer, then either serves the next pre-generated question or
    generates an adaptive follow-up. Returns (session_status, next_question_or_none).
    """
    question = db.get(Question, question_id)
    if question is None:
        raise ValueError(f"No question found with id {question_id}")

    answer = Answer(question_id=question_id, text=answer_text)
    db.add(answer)
    db.commit()

    session = db.get(InterviewSession, question.session_id)
    answered_count = (
        db.query(Question)
        .join(Answer, Answer.question_id == Question.id)
        .filter(Question.session_id == session.id)
        .count()
    )

    if answered_count >= settings.questions_per_session:
        session.status = "completed"
        from datetime import datetime, timezone

        session.completed_at = datetime.now(timezone.utc)
        db.commit()
        _CHUNK_CACHE.pop(session.id, None)
        _PREGEN_CACHE.pop(session.id, None)
        return "completed", None

    pregen = _PREGEN_CACHE.get(session.id, [])
    if pregen:
        next_data = pregen.pop(0)
        strategy = "pregenerated"
    else:
        chunks = _CHUNK_CACHE.get(session.id, [])
        next_data = generate_followup_question(
            role=session.role,
            previous_question=question.text,
            previous_answer=answer_text,
            remaining_chunks=chunks,
        )
        strategy = next_data.get("strategy", "new_topic")

    next_question = Question(
        session_id=session.id,
        text=next_data["text"],
        topic=next_data.get("topic"),
        difficulty=next_data.get("difficulty"),
        source_chunk_ids=next_data.get("source_chunk_ids", []),
        generated_from_skill=next_data.get("generated_from_skill"),
        order_index=answered_count,
    )
    db.add(next_question)
    db.commit()
    db.refresh(next_question)

    return "in_progress", next_question
