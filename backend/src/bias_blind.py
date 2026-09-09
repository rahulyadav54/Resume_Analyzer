import re


PII_PATTERNS = [
    (r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", "[EMAIL]"),
    (r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b", "[PHONE]"),
    (r"\b(?:linkedin\.com/in/|github\.com/)[\w-]+\b", "[PROFILE_LINK]"),
    (r"\b(?:male|female|non-binary|he/him|she/her|they/them)\b", "[GENDER]"),
]

NAME_LINE_PATTERNS = [
    r"^name\s*:",
    r"^full\s*name\s*:",
]


def anonymize_resume(resume_text: str, candidate_name: str | None = None) -> str:
    anonymized = resume_text

    if candidate_name:
        for part in candidate_name.split():
            if len(part) > 2:
                anonymized = re.sub(
                    rf"\b{re.escape(part)}\b",
                    "[NAME]",
                    anonymized,
                    flags=re.IGNORECASE,
                )

    for pattern, replacement in PII_PATTERNS:
        anonymized = re.sub(pattern, replacement, anonymized, flags=re.IGNORECASE)

    lines = []
    for line in anonymized.splitlines():
        stripped = line.strip()
        if any(re.match(p, stripped, re.IGNORECASE) for p in NAME_LINE_PATTERNS):
            lines.append("[NAME]")
            continue
        if stripped and len(stripped.split()) <= 4 and stripped.isupper():
            lines.append("[NAME]")
            continue
        lines.append(line)

    anonymized = "\n".join(lines)
    anonymized = re.sub(
        r"\b(?:university|college|institute|iit|nit|bits|vit|srm|anna university)[\w\s,.-]{0,40}",
        "[INSTITUTION]",
        anonymized,
        flags=re.IGNORECASE,
    )
    return anonymized


def analyze_bias_blind(
    standard_score: float,
    blind_score: float,
    standard_decision: str,
    blind_decision: str,
) -> dict:
    delta = round(blind_score - standard_score, 2)
    if abs(delta) < 3:
        impact = "minimal"
        note = "Score remained stable after removing identifying information."
    elif delta > 0:
        impact = "positive"
        note = "Candidate scored higher in bias-blind mode — identity cues may have lowered the standard score."
    else:
        impact = "negative"
        note = "Candidate scored lower in bias-blind mode — skills may have been over-weighted vs profile signals."

    decision_changed = standard_decision != blind_decision

    return {
        "enabled": True,
        "standard_score": standard_score,
        "blind_score": blind_score,
        "score_delta": delta,
        "standard_decision": standard_decision,
        "blind_decision": blind_decision,
        "decision_changed": decision_changed,
        "impact": impact,
        "summary": note,
    }
