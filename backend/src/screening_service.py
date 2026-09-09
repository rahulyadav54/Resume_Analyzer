import os
from pathlib import Path

from src.text_extractor import extract_resume_text
from src.skill_matcher import extract_skills_from_jd
from src.matching_engine import match_candidate, rank_candidates
from src.recommendation_engine import generate_recommendation
from src.report_generator import save_csv_report
from src.bias_blind import anonymize_resume, analyze_bias_blind
from src.integrity_checker import check_resume_integrity
from src.interview_questions import generate_interview_questions
from src.duplicate_detector import extract_contact_fingerprint, find_duplicate_warning
from src.jd_analyzer import analyze_job_description

BASE_DIR = Path(__file__).resolve().parent.parent.parent
RESUME_FOLDER = BASE_DIR / "resumes"
UPLOAD_FOLDER = Path(__file__).resolve().parent.parent / "uploads"

DEFAULT_JOB_DESCRIPTION = """
We are hiring a Python Developer Intern with strong knowledge of Python, SQL,
FastAPI, Machine Learning, Pandas, NumPy, Scikit-learn, Git, REST API,
and data analysis. The ideal candidate should have relevant projects,
internship experience, and problem-solving skills.
""".strip()

DEFAULT_REQUIRED_SKILLS = [
    "python",
    "sql",
    "fastapi",
    "machine learning",
    "pandas",
    "numpy",
    "scikit-learn",
    "git",
    "rest api",
    "data analysis",
]


def _finalize_candidate(result: dict, resume_text: str, bias_blind_mode: bool) -> dict:
    profile = {
        "education": result["education"],
        "certifications": result["certifications"],
        "internships": result["internships"],
        "projects": result["projects"],
    }

    recommendation = generate_recommendation(
        candidate_name=result["candidate_name"],
        final_score=result["final_score"],
        decision=result["decision"],
        matched_skills=result["matched_skills"],
        missing_skills=result["missing_skills"],
        similarity_score=result["similarity_score"],
        profile=profile,
    )

    integrity = check_resume_integrity(
        extracted_skills=result["extracted_skills"],
        matched_skills=result["matched_skills"],
        profile=profile,
        resume_text=resume_text,
    )

    interview_questions = generate_interview_questions(
        matched_skills=result["matched_skills"],
        missing_skills=result["missing_skills"],
        projects=result["projects"],
        internships=result["internships"],
        decision=result["decision"],
    )

    result["recommendation"] = recommendation
    result["explanation"] = recommendation["ai_explanation"]
    result["integrity_check"] = integrity
    result["interview_questions"] = interview_questions

    if bias_blind_mode and result.get("bias_blind_analysis"):
        bb = result["bias_blind_analysis"]
        if bb.get("decision_changed"):
            recommendation["concerns"] = [
                *recommendation.get("concerns", []),
                "Bias-blind screening produced a different decision — review identity-neutral score.",
            ]
            result["recommendation"] = recommendation

    if integrity["risk_level"] == "high":
        recommendation["concerns"] = [
            *recommendation.get("concerns", []),
            integrity["summary"],
        ]
        result["recommendation"] = recommendation

    return result


def screen_resume_files(
    file_paths: list[str],
    job_description: str,
    required_skills: list[str] | None = None,
    bias_blind_mode: bool = False,
) -> dict:
    jd_text = job_description.strip()
    skills_list = required_skills or extract_skills_from_jd(jd_text)

    if not skills_list:
        skills_list = DEFAULT_REQUIRED_SKILLS

    jd_quality = analyze_job_description(jd_text, skills_list)
    candidates = []
    seen_for_duplicates: list[dict] = []
    duplicate_alerts: list[dict] = []

    for file_path in file_paths:
        resume_text = extract_resume_text(file_path)
        if not resume_text.strip():
            continue

        file_name = os.path.basename(file_path)
        candidate_name = os.path.splitext(file_name)[0].replace("_", " ").title()

        dup_warning = find_duplicate_warning(candidate_name, resume_text, seen_for_duplicates)
        fingerprint = extract_contact_fingerprint(resume_text)
        seen_for_duplicates.append({
            "candidate_name": candidate_name,
            "email": fingerprint["email"],
            "phone": fingerprint["phone"],
        })

        if bias_blind_mode:
            anonymized_text = anonymize_resume(resume_text, candidate_name)
            standard_result = match_candidate(
                candidate_name=candidate_name,
                resume_text=resume_text,
                job_description=jd_text,
                required_skills=skills_list,
            )
            blind_result = match_candidate(
                candidate_name="[Anonymous Candidate]",
                resume_text=anonymized_text,
                job_description=jd_text,
                required_skills=skills_list,
            )
            result = {**blind_result, "candidate_name": candidate_name}
            result["bias_blind_analysis"] = analyze_bias_blind(
                standard_score=standard_result["final_score"],
                blind_score=blind_result["final_score"],
                standard_decision=standard_result["decision"],
                blind_decision=blind_result["decision"],
            )
        else:
            result = match_candidate(
                candidate_name=candidate_name,
                resume_text=resume_text,
                job_description=jd_text,
                required_skills=skills_list,
            )

        result["duplicate_warning"] = dup_warning
        if dup_warning.get("is_duplicate"):
            duplicate_alerts.append({
                "candidate_name": candidate_name,
                "message": dup_warning["message"],
            })

        candidates.append(_finalize_candidate(result, resume_text, bias_blind_mode))

    ranked = rank_candidates(candidates)
    report_path = save_csv_report(ranked)

    return {
        "message": "Resume screening completed successfully",
        "total_candidates": len(ranked),
        "report_path": str(report_path),
        "auto_extracted_skills": skills_list,
        "job_description_used": jd_text,
        "jd_quality": jd_quality,
        "bias_blind_mode": bias_blind_mode,
        "duplicate_alerts": duplicate_alerts,
        "results": ranked,
    }


def run_demo_screening(
    job_description: str | None = None,
    required_skills: list[str] | None = None,
    bias_blind_mode: bool = False,
) -> dict:
    resume_files = sorted(
        str(path)
        for path in RESUME_FOLDER.glob("*")
        if path.suffix.lower() in {".pdf", ".docx", ".txt"}
    )

    if not resume_files:
        raise FileNotFoundError("No sample resumes found in the resumes/ folder.")

    return screen_resume_files(
        file_paths=resume_files,
        job_description=job_description or DEFAULT_JOB_DESCRIPTION,
        required_skills=required_skills or DEFAULT_REQUIRED_SKILLS,
        bias_blind_mode=bias_blind_mode,
    )
