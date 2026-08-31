import os
import tempfile

from sqlalchemy.orm import Session

from app.models.candidate import Candidate
from app.ai_pipeline.resume_parser import extract_text_from_resume, extract_skills


async def process_resume_upload(db: Session, file_bytes: bytes, filename: str, target_role: str) -> Candidate:
    """Persists the upload temporarily, parses it, extracts skills, stores a Candidate row."""
    suffix = os.path.splitext(filename)[1] or ".pdf"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        resume_text = extract_text_from_resume(tmp_path)
    finally:
        os.remove(tmp_path)

    if not resume_text.strip():
        raise ValueError("Could not extract any text from the uploaded resume.")

    skills = extract_skills(resume_text)

    candidate = Candidate(
        resume_text=resume_text,
        extracted_skills=skills,
        target_role=target_role,
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate
