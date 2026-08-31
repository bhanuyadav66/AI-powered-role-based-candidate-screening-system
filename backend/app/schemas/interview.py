from pydantic import BaseModel


class StartInterviewRequest(BaseModel):
    candidate_id: str
    role: str


class QuestionOut(BaseModel):
    question_id: str
    text: str
    topic: str | None = None
    order_index: int

    class Config:
        from_attributes = True


class StartInterviewResponse(BaseModel):
    session_id: str
    question: QuestionOut


class SubmitAnswerRequest(BaseModel):
    question_id: str
    answer_text: str


class SubmitAnswerResponse(BaseModel):
    status: str  # "in_progress" | "completed"
    next_question: QuestionOut | None = None


class SessionStatusResponse(BaseModel):
    session_id: str
    status: str
    questions_answered: int
    total_questions: int
