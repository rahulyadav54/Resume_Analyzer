from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from src.skill_matcher import extract_skills, get_skill_match
from src.text_cleaner import clean_text
from src.resume_parser import parse_resume_profile


SKILL_WEIGHT = 0.60
SIMILARITY_WEIGHT = 0.25
PROFILE_WEIGHT = 0.15


def calculate_similarity(resume_text: str, job_description: str) -> float:
    documents = [resume_text, job_description]
    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf_matrix = vectorizer.fit_transform(documents)
    similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    return round(similarity * 100, 2)


def calculate_profile_score(profile: dict) -> float:
    score = 0.0

    if profile.get("education"):
        score += 25
    if profile.get("internships"):
        score += 30
    if profile.get("projects"):
        score += 25
    if profile.get("certifications"):
        score += 20

    return min(score, 100)


def make_decision(score: float) -> str:
    if score >= 75:
        return "Shortlisted"
    if score >= 45:
        return "Review"
    return "Not Suitable"


def match_candidate(
    candidate_name: str,
    resume_text: str,
    job_description: str,
    required_skills: list,
) -> dict:
    cleaned_resume = clean_text(resume_text)
    cleaned_jd = clean_text(job_description)

    profile = parse_resume_profile(resume_text)
    candidate_skills = extract_skills(cleaned_resume)
    skill_result = get_skill_match(candidate_skills, required_skills)
    similarity_score = calculate_similarity(cleaned_resume, cleaned_jd)
    profile_score = calculate_profile_score(profile)

    final_score = (
        SKILL_WEIGHT * skill_result["skill_score"]
        + SIMILARITY_WEIGHT * similarity_score
        + PROFILE_WEIGHT * profile_score
    )
    final_score = round(min(final_score, 100), 2)
    decision = make_decision(final_score)

    return {
        "candidate_name": candidate_name,
        "extracted_skills": candidate_skills,
        "education": profile["education"],
        "certifications": profile["certifications"],
        "internships": profile["internships"],
        "projects": profile["projects"],
        "keywords": profile["keywords"],
        "matched_skills": skill_result["matched_skills"],
        "missing_skills": skill_result["missing_skills"],
        "skill_score": skill_result["skill_score"],
        "similarity_score": similarity_score,
        "profile_score": profile_score,
        "final_score": final_score,
        "decision": decision,
        "matching_breakdown": {
            "skill_weight": SKILL_WEIGHT,
            "similarity_weight": SIMILARITY_WEIGHT,
            "profile_weight": PROFILE_WEIGHT,
            "skill_contribution": round(SKILL_WEIGHT * skill_result["skill_score"], 2),
            "similarity_contribution": round(SIMILARITY_WEIGHT * similarity_score, 2),
            "profile_contribution": round(PROFILE_WEIGHT * profile_score, 2),
        },
    }


def rank_candidates(candidates: list[dict]) -> list[dict]:
    ranked = sorted(candidates, key=lambda item: item["final_score"], reverse=True)

    for index, candidate in enumerate(ranked, start=1):
        candidate["rank"] = index

    return ranked
