from src.matching_engine import match_candidate
from src.recommendation_engine import generate_recommendation


def score_resume(
    candidate_name: str,
    resume_text: str,
    job_description: str,
    required_skills: list,
) -> dict:
    result = match_candidate(
        candidate_name=candidate_name,
        resume_text=resume_text,
        job_description=job_description,
        required_skills=required_skills,
    )

    recommendation = generate_recommendation(
        candidate_name=candidate_name,
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
