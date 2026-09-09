import axios from "axios";
import type { ScreeningResponse } from "@/types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

export async function healthCheck() {
  const { data } = await api.get("/health");
  return data as { status: string };
}

export async function getDemoConfig() {
  const { data } = await api.get("/demo-config");
  return data as {
    job_description: string;
    required_skills: string;
    sample_resume_count: number;
  };
}

export async function extractSkillsFromJd(job_description: string) {
  const { data } = await api.post("/extract-skills-from-jd", { job_description });
  return data as {
    message: string;
    skills: string[];
    required_skills: string;
  };
}

export async function runDemoScreening() {
  const { data } = await api.post("/run-demo");
  return data as ScreeningResponse;
}

export async function screenResumes(params: {
  jobDescription: string;
  requiredSkills: string;
  files: File[];
  jobDescriptionFile?: File | null;
}) {
  const formData = new FormData();
  formData.append("job_description", params.jobDescription);
  formData.append("required_skills", params.requiredSkills);
  if (params.jobDescriptionFile) {
    formData.append("job_description_file", params.jobDescriptionFile);
  }
  params.files.forEach((file) => formData.append("files", file));

  const { data } = await api.post("/screen-resumes", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as ScreeningResponse;
}

export function downloadResultsCsv(
  rows: Array<Record<string, string | number>>,
  filename = "screening_results.csv"
) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
