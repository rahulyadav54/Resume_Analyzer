import os
import shutil
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.text_extractor import extract_resume_text
from src.skill_matcher import extract_skills_from_jd
from src.screening_service import (
    screen_resume_files,
    run_demo_screening,
    UPLOAD_FOLDER,
    DEFAULT_JOB_DESCRIPTION,
    DEFAULT_REQUIRED_SKILLS,
)

app = FastAPI(
    title="Automated Resume Screening API",
    description="Hackathon-ready resume screening, skill extraction, and candidate ranking platform",
    version="1.0.0",
)


def _cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "*").strip()
    if raw == "*":
        return ["*"]
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class JobDescriptionRequest(BaseModel):
    job_description: str


@app.get("/")
def home():
    return {
        "message": "Automated Resume Screening API is running",
        "endpoints": {
            "screen_resumes": "POST /screen-resumes",
            "run_demo": "POST /run-demo",
            "extract_skills": "POST /extract-skills-from-jd",
        },
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/demo-config")
def demo_config():
    return {
        "job_description": DEFAULT_JOB_DESCRIPTION,
        "required_skills": ", ".join(DEFAULT_REQUIRED_SKILLS),
        "sample_resume_count": len(list(UPLOAD_FOLDER.parent.parent.glob("resumes/*"))),
    }


@app.post("/extract-skills-from-jd")
def extract_skills_endpoint(payload: JobDescriptionRequest):
    if not payload.job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")

    skills = extract_skills_from_jd(payload.job_description)
    return {
        "message": "Skills extracted from job description",
        "skills": skills,
        "required_skills": ", ".join(skills),
    }


@app.post("/run-demo")
def run_demo():
    try:
        return run_demo_screening()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Demo screening failed: {exc}")


@app.post("/screen-resumes")
async def screen_resumes(
    job_description: str = Form(""),
    required_skills: str = Form(""),
    files: list[UploadFile] = File(...),
    job_description_file: Optional[UploadFile] = File(None),
):
    if not files:
        raise HTTPException(status_code=400, detail="Please upload at least one resume.")

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    jd_text = job_description.strip()

    if job_description_file and job_description_file.filename:
        jd_path = os.path.join(UPLOAD_FOLDER, job_description_file.filename)
        with open(jd_path, "wb") as buffer:
            shutil.copyfileobj(job_description_file.file, buffer)
        extracted_jd = extract_resume_text(jd_path)
        if extracted_jd.strip():
            jd_text = extracted_jd.strip()

    if not jd_text:
        raise HTTPException(
            status_code=400,
            detail="Job description is required. Provide text or upload a JD file.",
        )

    skills_list = [
        skill.strip().lower()
        for skill in required_skills.split(",")
        if skill.strip()
    ]

    saved_paths = []

    for file in files:
        if not file.filename:
            continue

        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        saved_paths.append(file_path)

    if not saved_paths:
        raise HTTPException(status_code=400, detail="No valid resume files were uploaded.")

    try:
        return screen_resume_files(
            file_paths=saved_paths,
            job_description=jd_text,
            required_skills=skills_list or None,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Screening failed: {exc}")
