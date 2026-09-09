def build_triage_summary(candidates: list[dict]) -> dict:
    immediate = []
    queue = []
    archive = []
    integrity_review = []

    for candidate in candidates:
        name = candidate.get("candidate_name", "Unknown")
        score = float(candidate.get("final_score") or 0)
        integrity = candidate.get("integrity_check") or {}
        risk = integrity.get("risk_level", "low")

        if risk in {"medium", "high"}:
            integrity_review.append(name)

        if score >= 75:
            immediate.append(name)
        elif score >= 45:
            queue.append(name)
        else:
            archive.append(name)

    total = len(candidates)
    manual_minutes_saved = round(total * 12)  # ~12 min per manual resume review

    return {
        "total_screened": total,
        "immediate_review": immediate,
        "queue_review": queue,
        "auto_archive": archive,
        "integrity_review": integrity_review,
        "immediate_count": len(immediate),
        "queue_count": len(queue),
        "archive_count": len(archive),
        "integrity_flag_count": len(integrity_review),
        "estimated_hours_saved": round(manual_minutes_saved / 60, 1),
        "summary": (
            f"{len(immediate)} ready for review, {len(queue)} in queue, "
            f"{len(archive)} auto-archived — ~{round(manual_minutes_saved / 60, 1)}h manual work saved."
        ),
    }
