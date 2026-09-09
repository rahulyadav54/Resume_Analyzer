import axios from "axios";
import { buildTriageSummary } from "@/lib/triage";
import type { JdQuality, ScreeningResponse } from "@/types";
import { getAuthToken } from "@/lib/auth";
import { getApiBase, loadRuntimeApiConfig, setApiBase } from "@/lib/apiBase";
import {
  MAX_FILE_SIZE_MB,
  MAX_RESUMES_PER_JOB,
  RESUME_BATCH_SIZE,
} from "@/lib/screeningLimits";

export {
  getApiBase,
  getApiDisplayUrl,
  isUsingLocalApi,
  loadRuntimeApiConfig,
  setApiBase,
} from "@/lib/apiBase";

export const api = axios.create({
  baseURL: getApiBase(),
  timeout: 600000,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function syncApiClientBaseUrl() {
  api.defaults.baseURL = getApiBase();
}

export async function healthCheck() {
  const { data } = await api.get("/health");
  return data as { status: string; database?: { enabled: boolean; status: string } };
}

export async function runDemoScreening(params?: {
  jobDescription?: string;
  requiredSkills?: string;
  jobId?: string;
  biasBlindMode?: boolean;
}) {
  const { data } = await api.post("/run-demo", {
    job_description: params?.jobDescription,
    required_skills: params?.requiredSkills,
    job_id: params?.jobId,
    bias_blind_mode: Boolean(params?.biasBlindMode),
  });
  return data as ScreeningResponse;
}

export async function analyzeJobDescription(job_description: string, required_skills?: string) {
  const { data } = await api.post("/analyze-jd", {
    job_description,
    required_skills,
  });
  return data as JdQuality;
}

export async function extractSkillsFromJd(job_description: string) {
  const { data } = await api.post("/extract-skills-from-jd", { job_description });
  return data as {
    message: string;
    skills: string[];
    required_skills: string;
  };
}

function validateResumeFiles(files: File[]) {
  if (files.length === 0) {
    throw new Error("Please select at least one resume.");
  }
  if (files.length > MAX_RESUMES_PER_JOB) {
    throw new Error(`Maximum ${MAX_RESUMES_PER_JOB} resumes allowed per upload.`);
  }

  const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
  for (const file of files) {
    if (file.size > maxBytes) {
      throw new Error(`${file.name} exceeds ${MAX_FILE_SIZE_MB}MB.`);
    }
  }
}

export async function screenResumes(params: {
  jobDescription: string;
  requiredSkills: string;
  files: File[];
  jobDescriptionFile?: File | null;
  jobId?: string;
  append?: boolean;
  biasBlindMode?: boolean;
}) {
  validateResumeFiles(params.files);

  const formData = new FormData();
  formData.append("job_description", params.jobDescription);
  formData.append("required_skills", params.requiredSkills);
  formData.append("append", String(Boolean(params.append)));
  formData.append("bias_blind_mode", String(Boolean(params.biasBlindMode)));
  if (params.jobDescriptionFile) {
    formData.append("job_description_file", params.jobDescriptionFile);
  }
  if (params.jobId) {
    formData.append("job_id", params.jobId);
  }
  params.files.forEach((file) => formData.append("files", file));

  const { data } = await api.post("/screen-resumes", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 600000,
  });
  return data as ScreeningResponse;
}

export type BatchProgress = {
  batch: number;
  totalBatches: number;
  processedFiles: number;
  totalFiles: number;
};

function chunkFiles<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function screenResumesInBatches(
  params: {
    jobDescription: string;
    requiredSkills: string;
    files: File[];
    jobId?: string;
    /** When true, all batches append to existing candidates instead of replacing on the first batch. */
    append?: boolean;
    biasBlindMode?: boolean;
  },
  onProgress?: (progress: BatchProgress) => void
) {
  validateResumeFiles(params.files);

  const batches = chunkFiles(params.files, RESUME_BATCH_SIZE);
  const allResults: ScreeningResponse["results"] = [];
  let processedFiles = 0;
  let jdQuality: JdQuality | undefined;
  let duplicateAlerts: ScreeningResponse["duplicate_alerts"] = [];

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    onProgress?.({
      batch: index + 1,
      totalBatches: batches.length,
      processedFiles,
      totalFiles: params.files.length,
    });

    const data = await screenResumes({
      jobDescription: params.jobDescription,
      requiredSkills: params.requiredSkills,
      files: batch,
      jobId: params.jobId,
      append: params.append ? true : index > 0,
      biasBlindMode: params.biasBlindMode,
    });

    allResults.push(...data.results);
    processedFiles += batch.length;
    jdQuality = data.jd_quality ?? jdQuality;
    duplicateAlerts = [...(duplicateAlerts ?? []), ...(data.duplicate_alerts ?? [])];
  }

  onProgress?.({
    batch: batches.length,
    totalBatches: batches.length,
    processedFiles: params.files.length,
    totalFiles: params.files.length,
  });

  return {
    message: "Resume screening completed successfully",
    total_candidates: allResults.length,
    jd_quality: jdQuality,
    duplicate_alerts: duplicateAlerts,
    triage_summary: buildTriageSummary(allResults),
    results: allResults,
  } satisfies Pick<
    ScreeningResponse,
    | "message"
    | "total_candidates"
    | "results"
    | "jd_quality"
    | "duplicate_alerts"
    | "triage_summary"
  >;
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
