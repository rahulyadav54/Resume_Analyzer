from src.experience_validator import validate_experience


def _evidence_text(profile: dict) -> str:
    parts = [
        " ".join(profile.get("projects") or []),
        " ".join(profile.get("internships") or []),
        " ".join(profile.get("education") or []),
        " ".join(profile.get("certifications") or []),
    ]
    return " ".join(parts).lower()


def check_resume_integrity(
    extracted_skills: list,
    matched_skills: list,
    profile: dict,
    resume_text: str,
) -> dict:
    flags: list[dict] = []
    evidence = _evidence_text(profile)
    lower_resume = resume_text.lower()

    unverified_skills = []
    for skill in extracted_skills:
        token = skill.lower()
        if token not in evidence:
            unverified_skills.append(skill)

    if unverified_skills:
        flags.append({
            "type": "unverified_skills",
            "severity": "high" if len(unverified_skills) >= 3 else "medium",
            "message": f"{len(unverified_skills)} skill(s) lack project or experience evidence",
            "details": unverified_skills[:8],
        })

    skill_count = len(extracted_skills)
    project_count = len(profile.get("projects") or [])
    internship_count = len(profile.get("internships") or [])

    if skill_count >= 12 and project_count == 0 and internship_count == 0:
        flags.append({
            "type": "keyword_stuffing",
            "severity": "high",
            "message": "High skill count with no projects or internships detected",
            "details": [],
        })
    elif skill_count >= 8 and project_count + internship_count < 2:
        flags.append({
            "type": "keyword_stuffing",
            "severity": "medium",
            "message": "Many skills listed but limited hands-on evidence",
            "details": [],
        })

    if not profile.get("education") and not profile.get("internships"):
        flags.append({
            "type": "thin_profile",
            "severity": "medium",
            "message": "No education or internship sections detected",
            "details": [],
        })

    if len(matched_skills) >= 5 and len(unverified_skills) >= len(matched_skills) / 2:
        flags.append({
            "type": "inflated_match",
            "severity": "high",
            "message": "Many matched skills are not backed by resume evidence",
            "details": unverified_skills[:5],
        })

    experience_validation = validate_experience(resume_text, profile, extracted_skills)
    flags.extend(experience_validation["flags"])

    repeated_skill_lines = lower_resume.count("skills") + lower_resume.count("technologies")
    unique_skill_ratio = len(set(extracted_skills)) / max(len(extracted_skills), 1)
    if skill_count >= 10 and repeated_skill_lines >= 3 and unique_skill_ratio < 0.7:
        flags.append({
            "type": "keyword_stuffing",
            "severity": "high",
            "message": "Repeated skill blocks suggest keyword stuffing",
            "details": [],
        })

    severity_rank = {"high": 3, "medium": 2, "low": 1}
    max_severity = max((severity_rank.get(f["severity"], 0) for f in flags), default=0)
    integrity_score = max(0, 100 - len(flags) * 15 - max_severity * 10)
    risk_level = "low" if integrity_score >= 75 else "medium" if integrity_score >= 50 else "high"

    return {
        "integrity_score": integrity_score,
        "risk_level": risk_level,
        "flag_count": len(flags),
        "flags": flags,
        "unverified_skills": unverified_skills[:10],
        "years_claimed": experience_validation.get("years_claimed") or [],
        "experience_evidence_count": experience_validation.get("experience_evidence_count", 0),
        "summary": (
            "Resume appears consistent and well-supported."
            if not flags
            else f"{len(flags)} integrity concern(s) detected — review before shortlisting."
        ),
    }
