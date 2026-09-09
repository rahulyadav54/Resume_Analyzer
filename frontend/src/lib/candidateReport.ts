import { downloadResultsCsv } from "@/lib/api";
import type { Candidate, Job } from "@/types";

function sanitizeFilename(name: string) {
  return name.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_").slice(0, 80) || "candidate";
}

export function buildCandidateReportData(candidate: Candidate, job?: Job | null) {
  return {
    Rank: candidate.rank,
    "Candidate Name": candidate.candidate_name,
    "Job Title": job?.title ?? "",
    Department: job?.department ?? "",
    Status: candidate.status,
    "Uploaded At": new Date(candidate.uploadedAt).toLocaleString(),
    "Resume File": candidate.fileName ?? "",
    Email: candidate.email ?? "",
    Location: candidate.location ?? "",
    "Experience (years)": candidate.experienceYears ?? "",
    "Final Score": Math.round(candidate.final_score * 10) / 10,
    Decision: candidate.decision,
    "Skill Score": candidate.skill_score,
    "Similarity Score": candidate.similarity_score,
    "Profile Score": candidate.profile_score,
    "Matched Skills": candidate.matched_skills.join(", "),
    "Missing Skills": candidate.missing_skills.join(", "),
    "Technical Skills": candidate.extracted_skills.join(", "),
    Education: candidate.education.join(" | "),
    Certifications: candidate.certifications.join(" | "),
    Internships: candidate.internships.join(" | "),
    Projects: candidate.projects.join(" | "),
    Keywords: candidate.keywords.join(", "),
    "AI Recommendation": candidate.recommendation?.recommended_action ?? candidate.decision,
    "AI Priority": candidate.recommendation?.priority ?? "",
    "AI Summary": candidate.recommendation?.summary ?? "",
    Strengths: (candidate.recommendation?.strengths ?? []).join("; "),
    Concerns: (candidate.recommendation?.concerns ?? []).join("; "),
    Explanation: candidate.explanation,
  };
}

export function downloadCandidateReport(candidate: Candidate, job?: Job | null) {
  const data = buildCandidateReportData(candidate, job);
  const rows = Object.entries(data).map(([Field, Value]) => ({ Field, Value }));
  const filename = `${sanitizeFilename(candidate.candidate_name)}_screening_report.csv`;
  downloadResultsCsv(rows, filename);
}

export function downloadCandidateReportText(candidate: Candidate, job?: Job | null) {
  const data = buildCandidateReportData(candidate, job);
  const lines = [
    "CANDIDATE SCREENING REPORT",
    "=".repeat(40),
    ...Object.entries(data).map(([key, value]) => `${key}: ${value}`),
    "",
    `Generated: ${new Date().toLocaleString()}`,
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFilename(candidate.candidate_name)}_screening_report.txt`;
  link.click();
  URL.revokeObjectURL(url);
}
