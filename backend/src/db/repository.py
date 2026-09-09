from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from src.db.supabase_client import get_supabase, is_db_enabled


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _job_row_to_api(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "title": row["title"],
        "department": row["department"],
        "location": row["location"],
        "employmentType": row["employment_type"],
        "description": row["description"],
        "requiredSkills": row.get("required_skills") or [],
        "preferredSkills": row.get("preferred_skills") or [],
        "experience": row.get("experience") or "",
        "education": row.get("education") or "",
        "certifications": row.get("certifications") or [],
        "status": row["status"],
        "scoringWeights": row.get("scoring_weights") or {},
        "createdAt": row["created_at"],
    }


def _job_api_to_row(job: dict[str, Any]) -> dict[str, Any]:
    job_id = job.get("id") or str(uuid4())
    return {
        "id": job_id,
        "title": job["title"],
        "department": job.get("department", "Engineering"),
        "location": job.get("location", "Remote"),
        "employment_type": job.get("employmentType", "Full Time"),
        "description": job["description"],
        "required_skills": job.get("requiredSkills", []),
        "preferred_skills": job.get("preferredSkills", []),
        "experience": job.get("experience", ""),
        "education": job.get("education", ""),
        "certifications": job.get("certifications", []),
        "status": job.get("status", "active"),
        "scoring_weights": job.get("scoringWeights", {}),
        "created_at": job.get("createdAt") or _now_iso(),
    }


def _candidate_row_to_api(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "jobId": row["job_id"],
        "rank": row.get("rank") or 0,
        "candidate_name": row["candidate_name"],
        "email": row.get("email"),
        "location": row.get("location"),
        "experienceYears": float(row["experience_years"]) if row.get("experience_years") is not None else None,
        "fileName": row.get("file_name"),
        "status": row["status"],
        "extracted_skills": row.get("extracted_skills") or [],
        "education": row.get("education") or [],
        "certifications": row.get("certifications") or [],
        "internships": row.get("internships") or [],
        "projects": row.get("projects") or [],
        "keywords": row.get("keywords") or [],
        "matched_skills": row.get("matched_skills") or [],
        "missing_skills": row.get("missing_skills") or [],
        "skill_score": float(row.get("skill_score") or 0),
        "similarity_score": float(row.get("similarity_score") or 0),
        "profile_score": float(row.get("profile_score") or 0),
        "final_score": float(row.get("final_score") or 0),
        "decision": row.get("decision") or "",
        "explanation": row.get("explanation") or "",
        "recommendation": row.get("recommendation") or {},
        "matching_breakdown": row.get("matching_breakdown") or {},
        "integrity_check": (row.get("matching_breakdown") or {}).get("integrity_check") or {},
        "interview_questions": (row.get("matching_breakdown") or {}).get("interview_questions") or [],
        "bias_blind_analysis": (row.get("matching_breakdown") or {}).get("bias_blind_analysis"),
        "duplicate_warning": (row.get("matching_breakdown") or {}).get("duplicate_warning"),
        "uploadedAt": row["uploaded_at"],
    }


def _candidate_result_to_row(job_id: str, result: dict[str, Any], file_name: str | None = None) -> dict[str, Any]:
    candidate_id = str(uuid4())
    name = result["candidate_name"]
    status = (
        "shortlisted"
        if result.get("decision") == "Shortlisted"
        else "reviewed"
        if result.get("decision") == "Review"
        else "ai_screened"
    )
    return {
        "id": candidate_id,
        "job_id": job_id,
        "candidate_name": name,
        "email": None,
        "location": None,
        "experience_years": max(0.5, round((result.get("profile_score", 0) / 40) * 10) / 10),
        "file_name": file_name or f"{name.replace(' ', '_')}.pdf",
        "status": status,
        "rank": result.get("rank") or 0,
        "extracted_skills": result.get("extracted_skills") or [],
        "education": result.get("education") or [],
        "certifications": result.get("certifications") or [],
        "internships": result.get("internships") or [],
        "projects": result.get("projects") or [],
        "keywords": result.get("keywords") or [],
        "matched_skills": result.get("matched_skills") or [],
        "missing_skills": result.get("missing_skills") or [],
        "skill_score": result.get("skill_score") or 0,
        "similarity_score": result.get("similarity_score") or 0,
        "profile_score": result.get("profile_score") or 0,
        "final_score": result.get("final_score") or 0,
        "decision": result.get("decision") or "",
        "explanation": result.get("explanation") or "",
        "recommendation": result.get("recommendation") or {},
        "matching_breakdown": {
            **(result.get("matching_breakdown") or {}),
            "integrity_check": result.get("integrity_check") or {},
            "interview_questions": result.get("interview_questions") or [],
            "bias_blind_analysis": result.get("bias_blind_analysis"),
            "duplicate_warning": result.get("duplicate_warning"),
        },
        "uploaded_at": _now_iso(),
    }


def _interview_row_to_api(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "candidateId": row["candidate_id"],
        "jobId": row["job_id"],
        "date": row["interview_date"],
        "type": row["interview_type"],
        "interviewer": row["interviewer"],
        "status": row["status"],
    }


def _resume_row_to_api(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "candidateId": row.get("candidate_id"),
        "candidateName": row["candidate_name"],
        "fileName": row["file_name"],
        "jobId": row["job_id"],
        "uploadedAt": row["uploaded_at"],
        "status": row["status"],
        "match": float(row["match_score"]) if row.get("match_score") is not None else None,
    }


def fetch_workspace() -> dict[str, Any] | None:
    client = get_supabase()
    if not client:
        return None

    jobs = [_job_row_to_api(r) for r in client.table("jobs").select("*").order("created_at", desc=True).execute().data]
    candidates = [
        _candidate_row_to_api(r)
        for r in client.table("candidates").select("*").order("final_score", desc=True).execute().data
    ]
    interviews = [
        _interview_row_to_api(r)
        for r in client.table("interviews").select("*").order("interview_date", desc=True).execute().data
    ]
    resumes = [
        _resume_row_to_api(r)
        for r in client.table("resumes").select("*").order("uploaded_at", desc=True).execute().data
    ]

    talent_pool = fetch_talent_pool()
    audit_logs = fetch_audit_logs()

    return {
        "jobs": jobs,
        "candidates": candidates,
        "interviews": interviews,
        "resumes": resumes,
        "talentPool": talent_pool,
        "auditLogs": audit_logs,
        "dbEnabled": True,
    }


def create_job(job: dict[str, Any]) -> dict[str, Any] | None:
    client = get_supabase()
    if not client:
        return None

    row = _job_api_to_row(job)
    inserted = client.table("jobs").insert(row).execute().data[0]
    return _job_row_to_api(inserted)


def count_job_candidates(job_id: str) -> int:
    client = get_supabase()
    if not client:
        return 0

    result = (
        client.table("candidates")
        .select("id", count="exact")
        .eq("job_id", job_id)
        .execute()
    )
    return int(result.count or 0)


def save_screening_results(
    job_id: str,
    results: list[dict[str, Any]],
    file_names: list[str] | None = None,
    append: bool = False,
) -> list[dict[str, Any]] | None:
    client = get_supabase()
    if not client:
        return None

    if not append:
        client.table("candidates").delete().eq("job_id", job_id).execute()
        client.table("resumes").delete().eq("job_id", job_id).execute()

    rows = []
    resume_rows = []
    for index, result in enumerate(results):
        file_name = file_names[index] if file_names and index < len(file_names) else None
        row = _candidate_result_to_row(job_id, result, file_name)
        rows.append(row)
        resume_rows.append(
            {
                "id": str(uuid4()),
                "candidate_id": row["id"],
                "job_id": job_id,
                "candidate_name": row["candidate_name"],
                "file_name": row["file_name"],
                "status": "analyzed",
                "match_score": row["final_score"],
                "uploaded_at": row["uploaded_at"],
            }
        )

    if not rows:
        return []

    client.table("candidates").insert(rows).execute()
    client.table("resumes").insert(resume_rows).execute()
    return [_candidate_row_to_api(r) for r in rows]


def rerank_job_candidates(job_id: str) -> list[dict[str, Any]] | None:
    client = get_supabase()
    if not client:
        return None

    candidates = (
        client.table("candidates")
        .select("*")
        .eq("job_id", job_id)
        .order("final_score", desc=True)
        .execute()
        .data
    )

    for index, row in enumerate(candidates, start=1):
        client.table("candidates").update({"rank": index}).eq("id", row["id"]).execute()
        row["rank"] = index

    return [_candidate_row_to_api(r) for r in candidates]


def delete_candidates(candidate_ids: list[str]) -> dict[str, Any]:
    client = get_supabase()
    if not client or not candidate_ids:
        return {"deleted": 0, "jobIds": []}

    rows = (
        client.table("candidates")
        .select("id, job_id")
        .in_("id", candidate_ids)
        .execute()
        .data
        or []
    )
    if not rows:
        return {"deleted": 0, "jobIds": []}

    ids = [row["id"] for row in rows]
    job_ids = list({row["job_id"] for row in rows})

    client.table("interviews").delete().in_("candidate_id", ids).execute()
    client.table("resumes").delete().in_("candidate_id", ids).execute()
    client.table("candidates").delete().in_("id", ids).execute()

    for job_id in job_ids:
        rerank_job_candidates(job_id)

    return {"deleted": len(ids), "jobIds": job_ids}


def delete_resumes(resume_ids: list[str]) -> dict[str, Any]:
    client = get_supabase()
    if not client or not resume_ids:
        return {"deleted": 0, "candidateIds": []}

    rows = (
        client.table("resumes")
        .select("id, candidate_id")
        .in_("id", resume_ids)
        .execute()
        .data
        or []
    )
    if not rows:
        return {"deleted": 0, "candidateIds": []}

    ids = [row["id"] for row in rows]
    candidate_ids = [row["candidate_id"] for row in rows if row.get("candidate_id")]

    client.table("resumes").delete().in_("id", ids).execute()

    if candidate_ids:
        delete_candidates(candidate_ids)

    return {"deleted": len(ids), "candidateIds": candidate_ids}


def update_candidate_status(candidate_id: str, status: str) -> dict[str, Any] | None:
    client = get_supabase()
    if not client:
        return None

    updated = (
        client.table("candidates")
        .update({"status": status})
        .eq("id", candidate_id)
        .execute()
        .data
    )
    if not updated:
        return None
    return _candidate_row_to_api(updated[0])


def create_interview(
    candidate_id: str,
    job_id: str,
    interview_type: str = "Technical",
    interviewer: str = "Ramiyaa",
) -> dict[str, Any] | None:
    client = get_supabase()
    if not client:
        return None

    from datetime import timedelta

    interview_date = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    row = {
        "id": str(uuid4()),
        "candidate_id": candidate_id,
        "job_id": job_id,
        "interview_date": interview_date,
        "interview_type": interview_type,
        "interviewer": interviewer,
        "status": "scheduled",
    }
    inserted = client.table("interviews").insert(row).execute().data[0]
    update_candidate_status(candidate_id, "interview")
    return _interview_row_to_api(inserted)


def _talent_pool_row_to_api(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "candidateId": row.get("candidate_id"),
        "candidateName": row["candidate_name"],
        "email": row.get("email"),
        "sourceJobId": row.get("source_job_id"),
        "sourceJobTitle": row.get("source_job_title") or "",
        "finalScore": float(row.get("final_score") or 0),
        "matchedSkills": row.get("matched_skills") or [],
        "notes": row.get("notes") or "",
        "savedAt": row["saved_at"],
    }


def _audit_row_to_api(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "action": row["action"],
        "actor": row["actor"],
        "target": row["target"],
        "details": row["details"],
        "metadata": row.get("metadata") or {},
        "createdAt": row["created_at"],
    }


def fetch_talent_pool() -> list[dict[str, Any]]:
    client = get_supabase()
    if not client:
        return []

    try:
        rows = (
            client.table("talent_pool")
            .select("*")
            .order("saved_at", desc=True)
            .execute()
            .data
            or []
        )
        return [_talent_pool_row_to_api(row) for row in rows]
    except Exception:
        return []


def add_to_talent_pool(entry: dict[str, Any]) -> dict[str, Any] | None:
    client = get_supabase()
    if not client:
        return None

    row = {
        "id": entry.get("id") or str(uuid4()),
        "candidate_id": entry.get("candidateId"),
        "candidate_name": entry["candidateName"],
        "email": entry.get("email"),
        "source_job_id": entry.get("sourceJobId"),
        "source_job_title": entry.get("sourceJobTitle") or "",
        "final_score": entry.get("finalScore") or 0,
        "matched_skills": entry.get("matchedSkills") or [],
        "notes": entry.get("notes") or "",
        "saved_at": entry.get("savedAt") or _now_iso(),
    }

    try:
        inserted = client.table("talent_pool").insert(row).execute().data[0]
        return _talent_pool_row_to_api(inserted)
    except Exception:
        return None


def remove_from_talent_pool(entry_id: str) -> bool:
    client = get_supabase()
    if not client:
        return False

    try:
        client.table("talent_pool").delete().eq("id", entry_id).execute()
        return True
    except Exception:
        return False


def fetch_audit_logs(limit: int = 200) -> list[dict[str, Any]]:
    client = get_supabase()
    if not client:
        return []

    try:
        rows = (
            client.table("audit_logs")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
            .data
            or []
        )
        return [_audit_row_to_api(row) for row in rows]
    except Exception:
        return []


def append_audit_log(entry: dict[str, Any]) -> dict[str, Any] | None:
    client = get_supabase()
    if not client:
        return None

    row = {
        "id": entry.get("id") or str(uuid4()),
        "action": entry["action"],
        "actor": entry.get("actor") or "system",
        "target": entry.get("target") or "",
        "details": entry.get("details") or "",
        "metadata": entry.get("metadata") or {},
        "created_at": entry.get("createdAt") or _now_iso(),
    }

    try:
        inserted = client.table("audit_logs").insert(row).execute().data[0]
        return _audit_row_to_api(inserted)
    except Exception:
        return None


def db_health() -> dict[str, Any]:
    if not is_db_enabled():
        return {"enabled": False, "status": "not_configured"}

    try:
        client = get_supabase()
        client.table("jobs").select("id", count="exact").limit(1).execute()
        return {"enabled": True, "status": "ok"}
    except Exception as exc:
        return {"enabled": True, "status": "error", "detail": str(exc)}
