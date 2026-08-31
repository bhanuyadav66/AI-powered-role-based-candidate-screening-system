import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.core.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=_uuid)
    session_id = Column(String, ForeignKey("interview_sessions.id"), nullable=False, unique=True)
    summary_text = Column(Text, nullable=False)
    strengths = Column(JSON, nullable=False, default=list)
    gaps = Column(JSON, nullable=False, default=list)
    topic_coverage = Column(JSON, nullable=False, default=dict)  # {"topic": "covered/weak", ...}
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("InterviewSession", back_populates="report")
