from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.session import InterviewSession
from app.schemas.report import ReportResponse, QATranscriptItem
from app.services.report_service import generate_report

router = APIRouter(prefix="/api/report", tags=["report"])


@router.get("/{session_id}", response_model=ReportResponse)
def get_report(session_id: str, db: Session = Depends(get_db)):
    session = db.get(InterviewSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found.")
    if session.status != "completed":
        raise HTTPException(status_code=409, detail="Interview session is not yet completed.")

    try:
        report = generate_report(db, session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    transcript = [
        QATranscriptItem(
            question=q.text,
            answer=q.answer.text if q.answer else "",
            topic=q.topic,
        )
        for q in session.questions
    ]

    return ReportResponse(
        session_id=session_id,
        summary_text=report.summary_text,
        strengths=report.strengths,
        gaps=report.gaps,
        topic_coverage=report.topic_coverage,
        transcript=transcript,
    )
