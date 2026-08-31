import json

from sqlalchemy.orm import Session

from app.models.session import InterviewSession
from app.models.qa import Question
from app.models.report import Report
from app.ai_pipeline.llm_client import generate

REPORT_SYSTEM_PROMPT = """You are a technical interview evaluator. Given a full interview \
transcript, produce an honest, structured assessment. Be specific -- reference actual topics \
discussed, not generic praise or criticism."""


def generate_report(db: Session, session_id: str) -> Report:
    session = db.get(InterviewSession, session_id)
    if session is None:
        raise ValueError(f"No session found with id {session_id}")

    existing = db.query(Report).filter(Report.session_id == session_id).one_or_none()
    if existing:
        return existing

    questions = (
        db.query(Question)
        .filter(Question.session_id == session_id)
        .order_by(Question.order_index)
        .all()
    )

    transcript_lines = []
    for q in questions:
        answer_text = q.answer.text if q.answer else "(not answered)"
        transcript_lines.append(f"Q ({q.topic}): {q.text}\nA: {answer_text}")
    transcript_block = "\n\n".join(transcript_lines)

    user_prompt = f"""Role: {session.role}

Full interview transcript:
---
{transcript_block}
---

Produce a JSON object with:
- "summary_text": 3-4 sentence overall assessment
- "strengths": list of specific strengths observed (topic-grounded, not generic)
- "gaps": list of specific gaps or weak areas observed
- "topic_coverage": object mapping each topic discussed to "strong" | "adequate" | "weak"

Respond with ONLY the JSON object, no other text."""

    from app.ai_pipeline.question_generator import _extract_json

    raw = generate(REPORT_SYSTEM_PROMPT, user_prompt, temperature=0.2)
    parsed = _extract_json(raw)
    if not isinstance(parsed, dict):
        print(f"[report_service] Failed to parse JSON object from LLM output:\n{raw}\n")
        parsed = {
            "summary_text": "Automated summary generation failed to parse; see raw transcript for manual review.",
            "strengths": [],
            "gaps": [],
            "topic_coverage": {},
        }

    report = Report(
        session_id=session_id,
        summary_text=parsed.get("summary_text", ""),
        strengths=parsed.get("strengths", []),
        gaps=parsed.get("gaps", []),
        topic_coverage=parsed.get("topic_coverage", {}),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
