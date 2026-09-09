RUBRIC_VERSION = "1.0.0"

STANDARD_WEIGHTS = {
    "skill_weight": 0.60,
    "similarity_weight": 0.25,
    "profile_weight": 0.15,
}

DECISION_THRESHOLDS = {
    "shortlist_min": 75,
    "review_min": 45,
}


def build_scoring_rubric(job_weights: dict | None = None) -> dict:
    weights = {**STANDARD_WEIGHTS, **(job_weights or {})}
    return {
        "rubric_version": RUBRIC_VERSION,
        "consistency_mode": "standardized",
        "locked_weights": weights,
        "decision_thresholds": DECISION_THRESHOLDS,
        "summary": (
            "All candidates in this batch are scored with the same locked rubric "
            f"(v{RUBRIC_VERSION}) for consistent, auditable screening."
        ),
    }
