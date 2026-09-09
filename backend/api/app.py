import os
import shutil
import uuid
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException

load_dotenv(Path(__file__).resolve().parent.parent / ".env")
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.text_extractor import extract_resume_text
from src.skill_matcher import extract_skills_from_jd
from src.screening_service import screen_resume_files, run_demo_screening, UPLOAD_FOLDER
from src.jd_analyzer import analyze_job_description
from src.config import MAX_FILE_SIZE_MB, MAX_RESUMES_PER_REQUEST, MAX_RESUMES_TOTAL
from src.db.repository import (
    count_job_candidates,
    db_health,
    is_db_enabled,
    rerank_job_candidates,
    save_screening_results,
)
from api.workspace import router as workspace_router
from api.auth import router as auth_router

app = FastAPI(
    title="Automated Resume Screening API",
    description="Hackathon-ready resume screening, skill extraction, and candidate ranking platform",
    version="1.0.0",
)


def _cors_origins() -> list[str]:
    default = "https://resume-analyzer-lyart-kappa.vercel.app,http://localhost:5173"
    raw = os.getenv("CORS_ORIGINS", default).strip()
    if raw == "*":
        return ["*"]
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    for origin in default.split(","):
        origin = origin.strip()
        if origin and origin not in origins:
            origins.append(origin)
    return origins


_cors = _cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors,
    allow_credentials="*" not in _cors,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workspace_router)
app.include_router(auth_router)


class JobDescriptionRequest(BaseModel):
    job_description: str


class DemoScreeningRequest(BaseModel):
    job_description: Optional[str] = None
    required_skills: Optional[str] = None
    job_id: Optional[str] = None
    bias_blind_mode: bool = False


class JdAnalysisRequest(BaseModel):
    job_description: str
    required_skills: Optional[str] = None


@app.get("/")
def home():
    return {
        "message": "Automated Resume Screening API is running",
        "endpoints": {
            "screen_resumes": "POST /screen-resumes",
            "run_demo": "POST /run-demo",
            "extract_skills": "POST /extract-skills-from-jd",
            "workspace": "GET /workspace",
        },
        "limits": {
            "max_resumes_per_request": MAX_RESUMES_PER_REQUEST,
            "max_resumes_total": MAX_RESUMES_TOTAL,
            "max_file_size_mb": MAX_FILE_SIZE_MB,
        },
    }


@app.get("/health")
def health():
    return {"status": "ok", "database": db_health()}


@app.post("/run-demo")
def run_demo(payload: DemoScreeningRequest = DemoScreeningRequest()):
    try:
        skills_list = [
            skill.strip().lower()
            for skill in (payload.required_skills or "").split(",")
            if skill.strip()
        ]
        response = run_demo_screening(
            job_description=payload.job_description,
            required_skills=skills_list or None,
            bias_blind_mode=payload.bias_blind_mode,
        )

        if payload.job_id and is_db_enabled():
            file_names = [
                os.path.basename(path)
                for path in sorted(
                    (UPLOAD_FOLDER.parent.parent / "resumes").glob("*")
                )
                if path.suffix.lower() in {".pdf", ".docx", ".txt"}
            ]
            save_screening_results(payload.job_id, response["results"], file_names)
            response["saved_to_database"] = True

        return response
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Demo screening failed: {exc}")


@app.post("/analyze-jd")
def analyze_jd_endpoint(payload: JdAnalysisRequest):
    if not payload.job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")

    skills_list = [
        skill.strip().lower()
        for skill in (payload.required_skills or "").split(",")
        if skill.strip()
    ]
    return analyze_job_description(payload.job_description, skills_list or None)


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


@app.post("/screen-resumes")
async def screen_resumes(
    job_description: str = Form(""),
    required_skills: str = Form(""),
    files: list[UploadFile] = File(...),
    job_description_file: Optional[UploadFile] = File(None),
    job_id: Optional[str] = Form(None),
    append: bool = Form(False),
    bias_blind_mode: bool = Form(False),
):
    if not files:
        raise HTTPException(status_code=400, detail="Please upload at least one resume.")

    if len(files) > MAX_RESUMES_PER_REQUEST:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_RESUMES_PER_REQUEST} resumes per request. Upload in batches (up to {MAX_RESUMES_TOTAL} total).",
        )

    if job_id and is_db_enabled():
        existing = count_job_candidates(job_id) if append else 0
        if existing + len(files) > MAX_RESUMES_TOTAL:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"This job already has {existing} candidates. "
                    f"You can add up to {max(0, MAX_RESUMES_TOTAL - existing)} more "
                    f"(max {MAX_RESUMES_TOTAL} per job)."
                ),
            )

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
    original_names: list[str] = []

    max_bytes = MAX_FILE_SIZE_MB * 1024 * 1024

    for file in files:
        if not file.filename:
            continue

        safe_name = f"{uuid.uuid4().hex}_{os.path.basename(file.filename)}"
        file_path = os.path.join(UPLOAD_FOLDER, safe_name)
        size = 0
        with open(file_path, "wb") as buffer:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > max_bytes:
                    buffer.close()
                    os.remove(file_path)
                    raise HTTPException(
                        status_code=400,
                        detail=f"File {file.filename} exceeds {MAX_FILE_SIZE_MB}MB limit.",
                    )
                buffer.write(chunk)
        saved_paths.append(file_path)
        original_names.append(file.filename)

    if not saved_paths:
        raise HTTPException(status_code=400, detail="No valid resume files were uploaded.")

    try:
        response = screen_resume_files(
            file_paths=saved_paths,
            job_description=jd_text,
            required_skills=skills_list or None,
            bias_blind_mode=bias_blind_mode,
        )

        if job_id and is_db_enabled():
            file_names = original_names
            save_screening_results(job_id, response["results"], file_names, append=append)
            rerank_job_candidates(job_id)
            response["saved_to_database"] = True

        return response
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Screening failed: {exc}")
