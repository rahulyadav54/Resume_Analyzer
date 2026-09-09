from pathlib import Path

import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent.parent
OUTPUT_DIR = BASE_DIR / "outputs"


def save_csv_report(results: list, output_path: str | None = None) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if output_path is None:
        output_path = OUTPUT_DIR / "screening_results.csv"
    else:
        output_path = Path(output_path)

    formatted_results = []

    for item in results:
        formatted_results.append({
            "Rank": item["rank"],
            "Candidate Name": item["candidate_name"],
            "Final Score": item["final_score"],
            "Decision": item["decision"],
            "Skill Score": item["skill_score"],
            "Similarity Score": item["similarity_score"],
            "Profile Score": item.get("profile_score", 0),
            "Matched Skills": ", ".join(item["matched_skills"]),
            "Missing Skills": ", ".join(item["missing_skills"]),
            "Technical Skills": ", ".join(item.get("extracted_skills", [])),
            "Education": " | ".join(item.get("education", [])),
            "Certifications": " | ".join(item.get("certifications", [])),
            "Internships": " | ".join(item.get("internships", [])),
            "Projects": " | ".join(item.get("projects", [])),
            "Keywords": ", ".join(item.get("keywords", [])),
            "AI Recommendation": item.get("recommendation", {}).get("recommended_action", ""),
            "Explanation": item["explanation"],
        })

    df = pd.DataFrame(formatted_results)
    df.to_csv(output_path, index=False)

    return output_path
