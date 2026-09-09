from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.db.repository import (
    create_interview,
    create_job,
    db_health,
    delete_candidates,
    delete_resumes,
    fetch_workspace,
    is_db_enabled,
    rerank_job_candidates,
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
    interviewer: str = "Ramiyaa"


class ScreeningSavePayload(BaseModel):
    jobId: str
    results: list[dict]
    fileNames: list[str] | None = None
    append: bool = False


class BulkDeletePayload(BaseModel):
    ids: list[str] = Field(default_factory=list)


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


@router.delete("/candidates")
def remove_candidates(payload: BulkDeletePayload):
    if not is_db_enabled():
        raise HTTPException(status_code=503, detail="Database not configured.")
    if not payload.ids:
        raise HTTPException(status_code=400, detail="No candidate ids provided.")

    result = delete_candidates(payload.ids)
    return {
        "message": f"Deleted {result['deleted']} candidate(s)",
        "deleted": result["deleted"],
        "jobIds": result["jobIds"],
    }


@router.delete("/resumes")
def remove_resumes(payload: BulkDeletePayload):
    if not is_db_enabled():
        raise HTTPException(status_code=503, detail="Database not configured.")
    if not payload.ids:
        raise HTTPException(status_code=400, detail="No resume ids provided.")

    result = delete_resumes(payload.ids)
    return {
        "message": f"Deleted {result['deleted']} resume(s)",
        "deleted": result["deleted"],
        "candidateIds": result["candidateIds"],
    }


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

    saved = save_screening_results(
        payload.jobId,
        payload.results,
        payload.fileNames,
        append=payload.append,
    )
    return {"message": "Screening results saved", "candidates": saved}


@router.post("/jobs/{job_id}/rerank")
def rerank_job(job_id: str):
    if not is_db_enabled():
        raise HTTPException(status_code=503, detail="Database not configured.")

    ranked = rerank_job_candidates(job_id)
    if ranked is None:
        raise HTTPException(status_code=500, detail="Could not rerank candidates.")
    return {"message": "Candidates reranked", "candidates": ranked}
