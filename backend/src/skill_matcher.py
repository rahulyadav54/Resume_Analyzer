import re

from data_skills import SKILLS


def extract_skills_from_jd(job_description: str) -> list:
    return extract_skills(job_description)


def extract_skills(text: str) -> list:
    found_skills = []

    for skill in SKILLS:
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if re.search(pattern, text.lower()):
            found_skills.append(skill)

    return sorted(list(set(found_skills)))


def get_skill_match(candidate_skills: list, required_skills: list) -> dict:
    candidate_set = set([skill.lower() for skill in candidate_skills])
    required_set = set([skill.lower().strip() for skill in required_skills if skill.strip()])

    matched = sorted(list(candidate_set.intersection(required_set)))
    missing = sorted(list(required_set.difference(candidate_set)))

    if len(required_set) == 0:
        score = 0
    else:
        score = len(matched) / len(required_set)

    return {
        "matched_skills": matched,
        "missing_skills": missing,
        "skill_score": round(score * 100, 2)
    }