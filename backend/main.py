from src.screening_service import run_demo_screening


if __name__ == "__main__":
    response = run_demo_screening()

    print("\nAutomated Resume Screening Completed Successfully!\n")

    for result in response["results"]:
        print(f"Rank {result['rank']}: {result['candidate_name']}")
        print(f"Score: {result['final_score']}%")
        print(f"Decision: {result['decision']}")
        print(f"Matched Skills: {', '.join(result['matched_skills'])}")
        print(f"Missing Skills: {', '.join(result['missing_skills'])}")
        print(f"Education: {', '.join(result['education']) or 'N/A'}")
        print(f"Projects: {', '.join(result['projects']) or 'N/A'}")
        print("-" * 60)

    print(f"\nCSV Report saved at: {response['report_path']}")
