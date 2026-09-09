def _title_case(skill: str) -> str:
    return skill.strip().title()


def generate_interview_questions(
    matched_skills: list,
    missing_skills: list,
    projects: list,
    internships: list,
    decision: str,
) -> list[dict]:
    questions: list[dict] = []

    for skill in missing_skills[:3]:
        questions.append({
            "category": "skill_gap",
            "skill": skill,
            "question": (
                f"You listed limited evidence for {_title_case(skill)}. "
                f"Can you describe a project or task where you used {_title_case(skill)}?"
            ),
        })

    for skill in matched_skills[:3]:
        questions.append({
            "category": "technical_depth",
            "skill": skill,
            "question": (
                f"Walk us through a challenging problem you solved using {_title_case(skill)}. "
                "What was your approach and outcome?"
            ),
        })

    if projects:
        project = projects[0]
        questions.append({
            "category": "project_verification",
            "skill": None,
            "question": (
                f"You mentioned '{project[:80]}'. "
                "What was your specific contribution and what technologies did you use?"
            ),
        })

    if internships:
        internship = internships[0]
        questions.append({
            "category": "experience_verification",
            "skill": None,
            "question": (
                f"Tell us about your role during '{internship[:80]}'. "
                "What deliverables did you own?"
            ),
        })

    if decision == "Review":
        questions.append({
            "category": "fit_assessment",
            "skill": None,
            "question": (
                "Your profile shows partial alignment with this role. "
                "Why do you believe you are a strong fit despite some skill gaps?"
            ),
        })

    if not questions:
        questions.append({
            "category": "general",
            "skill": None,
            "question": "Describe your most relevant project and how it prepares you for this role.",
        })

    return questions[:8]
