from pydantic import BaseModel, Field


class ExtractedSkills(BaseModel):
    languages: list[str] = Field(default_factory=list)
    frameworks: list[str] = Field(default_factory=list)
    ml_concepts: list[str] = Field(default_factory=list)
    domains: list[str] = Field(default_factory=list)


class CategoryBreakdownItem(BaseModel):
    matched: list[str] = Field(default_factory=list)
    missing: list[str] = Field(default_factory=list)
    contribution: float = 0.0


class FitScore(BaseModel):
    score: int
    category_breakdown: dict[str, CategoryBreakdownItem] = Field(default_factory=dict)


class ResumeUploadResponse(BaseModel):
    candidate_id: str
    extracted_skills: ExtractedSkills
    target_role: str
    fit_score: FitScore | None = None
