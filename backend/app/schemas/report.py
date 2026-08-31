from pydantic import BaseModel


class QATranscriptItem(BaseModel):
    question: str
    answer: str
    topic: str | None = None


class ReportResponse(BaseModel):
    session_id: str
    summary_text: str
    strengths: list[str]
    gaps: list[str]
    topic_coverage: dict[str, str]
    transcript: list[QATranscriptItem]
