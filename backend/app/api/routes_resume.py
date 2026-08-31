from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.resume import ResumeUploadResponse, ExtractedSkills, FitScore
from app.services.resume_service import process_resume_upload
from app.ai_pipeline.role_requirements import compute_fit_score

router = APIRouter(prefix="/api/resume", tags=["resume"])

ALLOWED_ROLES = {"ai_ml_engineer", "backend_engineer"}


@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    target_role: str = Form(...),
    db: Session = Depends(get_db),
):
    if target_role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported role '{target_role}'. Must be one of: {sorted(ALLOWED_ROLES)}",
        )

    if file.content_type not in ("application/pdf", "text/plain"):
        raise HTTPException(status_code=400, detail="Only PDF or plain text resumes are supported.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        candidate = await process_resume_upload(db, file_bytes, file.filename, target_role)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    fit_score_data = compute_fit_score(candidate.extracted_skills, candidate.target_role)

    return ResumeUploadResponse(
        candidate_id=candidate.id,
        extracted_skills=ExtractedSkills(**candidate.extracted_skills),
        target_role=candidate.target_role,
        fit_score=FitScore(**fit_score_data),
    )
