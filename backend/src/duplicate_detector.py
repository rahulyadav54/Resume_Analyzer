import re
from difflib import SequenceMatcher


def extract_contact_fingerprint(resume_text: str) -> dict:
    email_match = re.search(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", resume_text)
    phone_match = re.search(
        r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b",
        resume_text,
    )
    return {
        "email": email_match.group(0).lower() if email_match else None,
        "phone": re.sub(r"\D", "", phone_match.group(0)) if phone_match else None,
    }


def _name_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()


def find_duplicate_warning(
    candidate_name: str,
    resume_text: str,
    seen_candidates: list[dict],
) -> dict | None:
    fingerprint = extract_contact_fingerprint(resume_text)

    for seen in seen_candidates:
        reasons = []

        if fingerprint["email"] and fingerprint["email"] == seen.get("email"):
            reasons.append("same email")
        if fingerprint["phone"] and fingerprint["phone"] == seen.get("phone"):
            reasons.append("same phone")
        if _name_similarity(candidate_name, seen["candidate_name"]) >= 0.88:
            reasons.append("similar name")

        if reasons:
            return {
                "is_duplicate": True,
                "matched_candidate": seen["candidate_name"],
                "reasons": reasons,
                "message": f"Possible duplicate of '{seen['candidate_name']}' ({', '.join(reasons)})",
            }

    return {
        "is_duplicate": False,
        "matched_candidate": None,
        "reasons": [],
        "message": None,
    }
