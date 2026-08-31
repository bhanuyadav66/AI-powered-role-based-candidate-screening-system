from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.session import InterviewSession
from app.models.qa import Question, Answer
from app.schemas.interview import (
    StartInterviewRequest,
    StartInterviewResponse,
    QuestionOut,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
    SessionStatusResponse,
)
from app.services.interview_service import start_interview, submit_answer

router = APIRouter(prefix="/api/interview", tags=["interview"])


@router.post("/start", response_model=StartInterviewResponse)
def start(payload: StartInterviewRequest, db: Session = Depends(get_db)):
    try:
        session, question = start_interview(db, payload.candidate_id, payload.role)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    return StartInterviewResponse(
        session_id=session.id,
        question=QuestionOut(
            question_id=question.id, text=question.text, topic=question.topic, order_index=question.order_index
        ),
    )


@router.post("/{session_id}/answer", response_model=SubmitAnswerResponse)
def answer(session_id: str, payload: SubmitAnswerRequest, db: Session = Depends(get_db)):
    question = db.get(Question, payload.question_id)
    if question is None or question.session_id != session_id:
        raise HTTPException(status_code=404, detail="Question not found for this session.")
    if question.answer is not None:
        raise HTTPException(status_code=409, detail="This question has already been answered.")

    try:
        status, next_question = submit_answer(db, payload.question_id, payload.answer_text)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return SubmitAnswerResponse(
        status=status,
        next_question=(
            QuestionOut(
                question_id=next_question.id,
                text=next_question.text,
                topic=next_question.topic,
                order_index=next_question.order_index,
            )
            if next_question
            else None
        ),
    )


@router.get("/{session_id}/status", response_model=SessionStatusResponse)
def status(session_id: str, db: Session = Depends(get_db)):
    session = db.get(InterviewSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found.")

    total = len(session.questions)
    answered = sum(1 for q in session.questions if q.answer is not None)

    return SessionStatusResponse(
        session_id=session.id,
        status=session.status,
        questions_answered=answered,
        total_questions=total,
    )
