"""CLI helper — run screening on files in ../resumes for local testing."""

from src.screening_service import screen_resume_files, RESUME_FOLDER, DEFAULT_JOB_DESCRIPTION, DEFAULT_REQUIRED_SKILLS


if __name__ == "__main__":
    resume_files = sorted(
        str(path)
        for path in RESUME_FOLDER.glob("*")
        if path.suffix.lower() in {".pdf", ".docx", ".txt"}
    )

    if not resume_files:
        print("No resume files found in resumes/ folder.")
        raise SystemExit(1)

    response = screen_resume_files(
        file_paths=resume_files,
        job_description=DEFAULT_JOB_DESCRIPTION,
        required_skills=DEFAULT_REQUIRED_SKILLS,
    )

    print("\nResume screening completed.\n")
    for result in response["results"]:
        print(f"Rank {result['rank']}: {result['candidate_name']} — {result['final_score']}%")
    print(f"\nCSV Report: {response['report_path']}")
