def _build_strengths(
    matched_skills: list,
    profile: dict,
    similarity_score: float,
) -> list[str]:
    strengths = []

    if matched_skills:
        strengths.append(
            f"Strong skill alignment with {len(matched_skills)} required skills: "
            f"{', '.join(matched_skills[:5])}"
        )

    if profile.get("projects"):
        strengths.append(
            f"Demonstrates hands-on project experience ({len(profile['projects'])} projects identified)"
        )

    if profile.get("internships"):
        strengths.append("Has relevant internship experience in the field")

    if profile.get("certifications"):
        strengths.append(
            f"Holds {len(profile['certifications'])} professional certification(s)"
        )

    if profile.get("education"):
        strengths.append("Educational background matches technical hiring criteria")

    if similarity_score >= 60:
        strengths.append(
            f"High resume-to-job-description relevance ({similarity_score}% similarity)"
        )

    return strengths[:4]


def _build_concerns(missing_skills: list, profile: dict, final_score: float) -> list[str]:
    concerns = []

    if missing_skills:
        concerns.append(
            f"Missing key skills: {', '.join(missing_skills[:6])}"
        )

    if not profile.get("internships"):
        concerns.append("No internship experience detected on resume")

    if not profile.get("projects"):
        concerns.append("Limited project portfolio visible on resume")

    if final_score < 40:
        concerns.append("Overall match score is below hiring threshold")

    return concerns[:4]


def generate_recommendation(
    candidate_name: str,
    final_score: float,
    decision: str,
    matched_skills: list,
    missing_skills: list,
    similarity_score: float,
    profile: dict,
) -> dict:
    strengths = _build_strengths(matched_skills, profile, similarity_score)
    concerns = _build_concerns(missing_skills, profile, final_score)

    if decision == "Shortlisted":
        action = "Proceed to technical interview"
        summary = (
            f"{candidate_name} is a strong fit for this role with a {final_score}% match score. "
            "Recommend prioritizing for the next hiring round."
        )
        priority = "High"
    elif decision == "Review":
        action = "Schedule HR screening call"
        summary = (
            f"{candidate_name} shows partial alignment ({final_score}% match). "
            "A manual review is recommended before final decision."
        )
        priority = "Medium"
    else:
        action = "Archive for future roles"
        summary = (
            f"{candidate_name} has limited alignment ({final_score}% match) with current requirements. "
            "Not recommended for immediate shortlisting."
        )
        priority = "Low"

    explanation_parts = [summary]
    if strengths:
        explanation_parts.append(f"Key strengths: {'; '.join(strengths[:2])}.")
    if concerns:
        explanation_parts.append(f"Areas to verify: {'; '.join(concerns[:2])}.")

    return {
        "summary": summary,
        "strengths": strengths,
        "concerns": concerns,
        "recommended_action": action,
        "priority": priority,
        "ai_explanation": " ".join(explanation_parts),
    }
