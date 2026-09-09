import os
from pathlib import Path

from src.text_extractor import extract_resume_text
from src.skill_matcher import extract_skills_from_jd
from src.matching_engine import match_candidate, rank_candidates
from src.recommendation_engine import generate_recommendation
from src.report_generator import save_csv_report

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


def _finalize_candidate(result: dict) -> dict:
    recommendation = generate_recommendation(
        candidate_name=result["candidate_name"],
        final_score=result["final_score"],
        decision=result["decision"],
        matched_skills=result["matched_skills"],
        missing_skills=result["missing_skills"],
        similarity_score=result["similarity_score"],
        profile={
            "education": result["education"],
            "certifications": result["certifications"],
            "internships": result["internships"],
            "projects": result["projects"],
        },
    )

    result["recommendation"] = recommendation
    result["explanation"] = recommendation["ai_explanation"]
    return result


def screen_resume_files(
    file_paths: list[str],
    job_description: str,
    required_skills: list[str] | None = None,
) -> dict:
    jd_text = job_description.strip()
    skills_list = required_skills or extract_skills_from_jd(jd_text)

    if not skills_list:
        skills_list = DEFAULT_REQUIRED_SKILLS

    candidates = []

    for file_path in file_paths:
        resume_text = extract_resume_text(file_path)
        if not resume_text.strip():
            continue

        file_name = os.path.basename(file_path)
        candidate_name = os.path.splitext(file_name)[0].replace("_", " ").title()

        result = match_candidate(
            candidate_name=candidate_name,
            resume_text=resume_text,
            job_description=jd_text,
            required_skills=skills_list,
        )
        candidates.append(_finalize_candidate(result))

    ranked = rank_candidates(candidates)
    report_path = save_csv_report(ranked)

    return {
        "message": "Resume screening completed successfully",
        "total_candidates": len(ranked),
        "report_path": str(report_path),
        "auto_extracted_skills": skills_list,
        "job_description_used": jd_text,
        "results": ranked,
    }


def run_demo_screening(
    job_description: str | None = None,
    required_skills: list[str] | None = None,
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
    )
