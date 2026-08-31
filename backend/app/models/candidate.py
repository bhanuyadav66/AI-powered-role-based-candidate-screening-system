import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship

from app.core.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, nullable=True)
    resume_text = Column(Text, nullable=False)
    extracted_skills = Column(JSON, nullable=False, default=dict)  # {"languages": [...], "frameworks": [...], ...}
    target_role = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    sessions = relationship("InterviewSession", back_populates="candidate")
