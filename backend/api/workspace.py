from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.db.repository import (
    create_interview,
    create_job,
    db_health,
    fetch_workspace,
    is_db_enabled,
    save_screening_results,
    update_candidate_status,
)

router = APIRouter(prefix="/workspace", tags=["workspace"])


class JobCreatePayload(BaseModel):
    title: str
    department: str = "Engineering"
    location: str = "Remote"
    employmentType: str = "Full Time"
    description: str
    requiredSkills: list[str] = Field(default_factory=list)
    preferredSkills: list[str] = Field(default_factory=list)
    experience: str = ""
    education: str = ""
    certifications: list[str] = Field(default_factory=list)
    status: str = "active"
    scoringWeights: dict = Field(default_factory=dict)


class CandidateStatusPayload(BaseModel):
    status: str


class InterviewCreatePayload(BaseModel):
    candidateId: str
    jobId: str
    type: str = "Technical"
    interviewer: str = "Rahul Mehta"


class ScreeningSavePayload(BaseModel):
    jobId: str
    results: list[dict]
    fileNames: list[str] | None = None


@router.get("/status")
def workspace_status():
    return db_health()


@router.get("")
def get_workspace():
    if not is_db_enabled():
        return {"dbEnabled": False, "jobs": [], "candidates": [], "interviews": [], "resumes": []}

    data = fetch_workspace()
    return data


@router.post("/jobs")
def post_job(payload: JobCreatePayload):
    if not is_db_enabled():
        raise HTTPException(status_code=503, detail="Database not configured.")

    job = create_job(payload.model_dump())
    return {"message": "Job created", "job": job}


@router.patch("/candidates/{candidate_id}/status")
def patch_candidate_status(candidate_id: str, payload: CandidateStatusPayload):
    if not is_db_enabled():
        raise HTTPException(status_code=503, detail="Database not configured.")

    updated = update_candidate_status(candidate_id, payload.status)
    if not updated:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    return {"message": "Status updated", "candidate": updated}


@router.post("/interviews")
def post_interview(payload: InterviewCreatePayload):
    if not is_db_enabled():
        raise HTTPException(status_code=503, detail="Database not configured.")

    interview = create_interview(
        candidate_id=payload.candidateId,
        job_id=payload.jobId,
        interview_type=payload.type,
        interviewer=payload.interviewer,
    )
    return {"message": "Interview scheduled", "interview": interview}


@router.post("/screening-results")
def post_screening_results(payload: ScreeningSavePayload):
    if not is_db_enabled():
        raise HTTPException(status_code=503, detail="Database not configured.")

    saved = save_screening_results(payload.jobId, payload.results, payload.fileNames)
    return {"message": "Screening results saved", "candidates": saved}
