import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship

from app.core.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class Question(Base):
    __tablename__ = "questions"

    id = Column(String, primary_key=True, default=_uuid)
    session_id = Column(String, ForeignKey("interview_sessions.id"), nullable=False)
    text = Column(Text, nullable=False)
    topic = Column(String, nullable=True)
    difficulty = Column(String, nullable=True)  # easy | medium | hard
    # Traceability: which retrieved chunks + which resume skill led to this question
    source_chunk_ids = Column(JSON, nullable=False, default=list)
    generated_from_skill = Column(String, nullable=True)
    order_index = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("InterviewSession", back_populates="questions")
    answer = relationship("Answer", back_populates="question", uselist=False)


class Answer(Base):
    __tablename__ = "answers"

    id = Column(String, primary_key=True, default=_uuid)
    question_id = Column(String, ForeignKey("questions.id"), nullable=False, unique=True)
    text = Column(Text, nullable=False)
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    question = relationship("Question", back_populates="answer")
