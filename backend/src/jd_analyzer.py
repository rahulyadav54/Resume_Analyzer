import re

from src.skill_matcher import extract_skills_from_jd


def analyze_job_description(job_description: str, required_skills: list | None = None) -> dict:
    text = job_description.strip()
    lower = text.lower()
    word_count = len(text.split())
    skills = required_skills or extract_skills_from_jd(text)

    suggestions: list[str] = []
    score = 100

    if word_count < 40:
        score -= 25
        suggestions.append("Job description is too short — add responsibilities and qualifications.")
    elif word_count < 80:
        score -= 10
        suggestions.append("Consider expanding the job description with role expectations.")

    if not skills:
        score -= 20
        suggestions.append("No technical skills detected — list required skills explicitly.")

    experience_markers = ["year", "years", "fresher", "intern", "senior", "junior", "entry"]
    if not any(marker in lower for marker in experience_markers):
        score -= 15
        suggestions.append("Specify experience level (e.g. 0–2 years, intern, senior).")

    responsibility_markers = ["responsible", "develop", "build", "manage", "design", "implement", "work"]
    if not any(marker in lower for marker in responsibility_markers):
        score -= 10
        suggestions.append("Add key responsibilities so candidates understand the role.")

    education_markers = ["b.tech", "b.e", "degree", "bachelor", "master", "diploma", "b.sc", "m.tech"]
    if not any(marker in lower for marker in education_markers):
        score -= 5
        suggestions.append("Optional: mention education requirements if relevant.")

    if re.search(r"\betc\.?\b|\band more\b|\bsimilar\b", lower):
        score -= 5
        suggestions.append('Avoid vague terms like "etc." — list specific skills instead.')

    clarity = "excellent" if score >= 85 else "good" if score >= 70 else "fair" if score >= 50 else "poor"

    return {
        "jd_quality_score": max(0, min(100, score)),
        "clarity_rating": clarity,
        "word_count": word_count,
        "skills_detected": len(skills),
        "suggestions": suggestions[:5],
        "summary": (
            "Job description is well-structured for accurate AI screening."
            if score >= 75
            else "Improve the job description before screening for better match accuracy."
        ),
    }
