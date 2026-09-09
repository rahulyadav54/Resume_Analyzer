import re


def _years_claimed(resume_text: str) -> list[float]:
    pattern = r"(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)"
    return [float(match.group(1)) for match in re.finditer(pattern, resume_text.lower())]


def _skills_section_only(resume_text: str, extracted_skills: list) -> list[str]:
    if not extracted_skills:
        return []

    lower = resume_text.lower()
    body_without_skills = re.sub(
        r"(?is)(technical\s+skills?|skills?|core\s+competencies|technologies?).*?(?=\n\s*\n|\n[A-Z][a-z]+|\Z)",
        " ",
        lower,
    )
    orphaned = []
    for skill in extracted_skills[:15]:
        token = skill.lower()
        if token in lower and token not in body_without_skills:
            orphaned.append(skill)
    return orphaned


def validate_experience(
    resume_text: str,
    profile: dict,
    extracted_skills: list,
) -> dict:
    flags: list[dict] = []
    lower = resume_text.lower()
    years = _years_claimed(resume_text)
    project_count = len(profile.get("projects") or [])
    internship_count = len(profile.get("internships") or [])
    experience_entries = internship_count + project_count

    max_years = max(years) if years else 0
    if max_years >= 4 and experience_entries < 2:
        flags.append({
            "type": "inflated_experience",
            "severity": "high",
            "message": f"Claims {max_years}+ years experience but limited project/internship evidence",
            "details": [f"{max_years} years claimed"],
        })
    elif max_years >= 2 and experience_entries == 0:
        flags.append({
            "type": "inflated_experience",
            "severity": "medium",
            "message": "Experience years stated without supporting work history sections",
            "details": [],
        })

    senior_tokens = ("senior", "lead", "principal", "architect", "manager", "head of")
    if any(token in lower for token in senior_tokens) and experience_entries < 2:
        flags.append({
            "type": "title_inflation",
            "severity": "high",
            "message": "Senior-level title detected with thin supporting experience",
            "details": [],
        })

    overlapping_roles = len(re.findall(r"(?i)(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}", resume_text))
    if overlapping_roles >= 8 and max_years <= 3:
        flags.append({
            "type": "timeline_inconsistency",
            "severity": "medium",
            "message": "Dense employment timeline may indicate overlapping or inflated tenure",
            "details": [],
        })

    skills_only = _skills_section_only(resume_text, extracted_skills)
    if len(skills_only) >= 4:
        flags.append({
            "type": "skills_section_only",
            "severity": "high",
            "message": f"{len(skills_only)} skill(s) appear only in the skills section, not in experience",
            "details": skills_only[:8],
        })

    return {
        "flags": flags,
        "years_claimed": years,
        "experience_evidence_count": experience_entries,
    }
