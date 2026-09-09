import re

from sklearn.feature_extraction.text import TfidfVectorizer

EDUCATION_PATTERNS = [
    r"b\.?\s*tech",
    r"b\.?\s*e\.?",
    r"m\.?\s*tech",
    r"m\.?\s*e\.?",
    r"b\.?\s*sc",
    r"m\.?\s*sc",
    r"bca",
    r"mca",
    r"mba",
    r"bachelor(?:'s)?\s+(?:of\s+)?(?:science|engineering|technology|arts|commerce)",
    r"master(?:'s)?\s+(?:of\s+)?(?:science|engineering|technology|arts|business)",
    r"ph\.?\s*d",
    r"diploma",
    r"computer\s+engineering",
    r"information\s+technology",
    r"computer\s+science",
    r"data\s+science",
    r"electronics",
    r"mechanical\s+engineering",
]

CERTIFICATION_PATTERNS = [
    r"aws\s+certified",
    r"azure\s+certified",
    r"google\s+cloud\s+certified",
    r"google\s+professional",
    r"microsoft\s+certified",
    r"cisco\s+certified",
    r"oracle\s+certified",
    r"comptia",
    r"coursera",
    r"udemy",
    r"certified\s+(?:data\s+)?(?:scientist|engineer|developer|analyst)",
    r"ibm\s+certified",
    r"meta\s+certified",
    r"scrum\s+master",
    r"pmp",
    r"cka|ckad",
]

INTERNSHIP_PATTERNS = [
    r"(?:software|data|python|java|web|frontend|backend|ml|ai|devops|cloud)\s+(?:developer|engineer|analyst)?\s+intern",
    r"internship\s+at\s+[\w\s&]+",
    r"intern\s+(?:at|with)\s+[\w\s&]+",
    r"summer\s+intern",
    r"research\s+intern",
]

SECTION_HEADERS = {
    "projects": r"^(?:projects?|academic\s+projects?|personal\s+projects?)\s*:?\s*$",
    "experience": r"^(?:experience|work\s+experience|internship|internships?)\s*:?\s*$",
    "education": r"^(?:education|academic\s+background)\s*:?\s*$",
    "certifications": r"^(?:certifications?|licenses?|credentials?)\s*:?\s*$",
    "skills": r"^(?:skills?|technical\s+skills?|core\s+skills?)\s*:?\s*$",
}

ALL_SECTION_PATTERNS = list(SECTION_HEADERS.values())


def _find_section_lines(text: str, section_key: str) -> list[str]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    section_pattern = SECTION_HEADERS[section_key]
    collected = []
    in_section = False

    for line in lines:
        if re.match(section_pattern, line, re.IGNORECASE):
            in_section = True
            continue

        if in_section and any(
            re.match(pattern, line, re.IGNORECASE) for pattern in ALL_SECTION_PATTERNS
        ):
            break

        if in_section:
            collected.append(line)

    return collected


def extract_education(text: str) -> list[str]:
    found = []

    section_lines = _find_section_lines(text, "education")
    for line in section_lines:
        cleaned = re.sub(r"\s+", " ", line).strip()
        if cleaned and len(cleaned) > 5:
            found.append(cleaned[:100])

    if found:
        return found[:5]

    degree_pattern = re.compile(
        r"(?:B\.?Tech|M\.?Tech|B\.?E\.?|M\.?E\.?|B\.?Sc|M\.?Sc|BCA|MCA|MBA|Ph\.?D|Diploma)"
        r"[^.\n]{0,60}",
        re.IGNORECASE,
    )

    for match in degree_pattern.finditer(text):
        snippet = re.sub(r"\s+", " ", match.group(0)).strip()
        if snippet not in found:
            found.append(snippet[:100])

    return found[:5]


def extract_certifications(text: str) -> list[str]:
    found = set()
    lower_text = text.lower()

    for pattern in CERTIFICATION_PATTERNS:
        for match in re.finditer(pattern, lower_text, re.IGNORECASE):
            snippet = text[max(0, match.start() - 5) : match.end() + 50].strip()
            snippet = re.sub(r"\s+", " ", snippet)
            found.add(snippet[:100])

    for line in _find_section_lines(text, "certifications"):
        found.add(line[:100])

    return sorted(found)[:8]


def extract_internships(text: str) -> list[str]:
    found = set()
    lower_text = text.lower()

    for pattern in INTERNSHIP_PATTERNS:
        for match in re.finditer(pattern, lower_text, re.IGNORECASE):
            snippet = text[max(0, match.start() - 10) : match.end() + 60].strip()
            snippet = re.sub(r"\s+", " ", snippet)
            found.add(snippet[:120])

    for line in _find_section_lines(text, "experience"):
        if "intern" in line.lower():
            found.add(line[:120])

    return sorted(found)[:5]


def extract_projects(text: str) -> list[str]:
    projects = []

    for line in _find_section_lines(text, "projects"):
        cleaned = re.sub(r"^[-•*]\s*", "", line).strip()
        if cleaned and len(cleaned) > 3:
            projects.append(cleaned[:120])

    if not projects:
        project_section = re.search(
            r"projects?\s*:?\s*(.+?)(?:\n\n|\n(?:experience|skills|education)\s*:)",
            text,
            re.IGNORECASE | re.DOTALL,
        )
        if project_section:
            raw_lines = [
                line.strip()
                for line in project_section.group(1).splitlines()
                if line.strip()
            ]
            projects = [line[:120] for line in raw_lines[:6]]

    return projects[:6]


def extract_keywords(text: str, top_n: int = 12) -> list[str]:
    cleaned = re.sub(r"[^a-zA-Z0-9+#.\s]", " ", text.lower())
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    if len(cleaned.split()) < 10:
        return []

    try:
        vectorizer = TfidfVectorizer(
            stop_words="english",
            max_features=top_n,
            ngram_range=(1, 2),
        )
        matrix = vectorizer.fit_transform([cleaned])
        features = vectorizer.get_feature_names_out()
        scores = matrix.toarray()[0]
        ranked = sorted(zip(features, scores), key=lambda item: item[1], reverse=True)
        return [word for word, score in ranked if score > 0][:top_n]
    except ValueError:
        return []


def parse_resume_profile(text: str) -> dict:
    return {
        "education": extract_education(text),
        "certifications": extract_certifications(text),
        "internships": extract_internships(text),
        "projects": extract_projects(text),
        "keywords": extract_keywords(text),
    }
