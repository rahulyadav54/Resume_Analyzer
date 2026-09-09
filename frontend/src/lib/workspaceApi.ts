import { api } from "@/lib/api";
import type {
  AuditLogEntry,
  Candidate,
  CandidateStatus,
  Interview,
  Job,
  ResumeRecord,
  ScreeningResult,
  TalentPoolEntry,
} from "@/types";

export type WorkspaceData = {
  dbEnabled: boolean;
  jobs: Job[];
  candidates: Candidate[];
  interviews: Interview[];
  resumes: ResumeRecord[];
  talentPool: TalentPoolEntry[];
  auditLogs: AuditLogEntry[];
};

export async function fetchWorkspace(): Promise<WorkspaceData> {
  const { data } = await api.get("/workspace");
  return {
    dbEnabled: Boolean(data.dbEnabled),
    jobs: data.jobs ?? [],
    candidates: data.candidates ?? [],
    interviews: data.interviews ?? [],
    resumes: data.resumes ?? [],
    talentPool: data.talentPool ?? [],
    auditLogs: data.auditLogs ?? [],
  };
}

export async function fetchDbStatus() {
  const { data } = await api.get("/workspace/status");
  return data as { enabled: boolean; status: string };
}

export async function createJobApi(job: Omit<Job, "id" | "createdAt">) {
  const { data } = await api.post("/workspace/jobs", job);
  return data.job as Job;
}

export async function updateCandidateStatusApi(candidateId: string, status: CandidateStatus) {
  const { data } = await api.patch(`/workspace/candidates/${candidateId}/status`, { status });
  return data.candidate as Candidate;
}

export async function scheduleInterviewApi(
  candidateId: string,
  jobId: string,
  type = "Technical",
  interviewer = "Recruiter"
) {
  const { data } = await api.post("/workspace/interviews", {
    candidateId,
    jobId,
    type,
    interviewer,
  });
  return data.interview as Interview;
}

export async function saveScreeningResultsApi(
  jobId: string,
  results: ScreeningResult[],
  fileNames?: string[],
  append = false
) {
  const { data } = await api.post("/workspace/screening-results", {
    jobId,
    results,
    fileNames,
    append,
  });
  return data.candidates as Candidate[];
}

export async function rerankJobApi(jobId: string) {
  const { data } = await api.post(`/workspace/jobs/${jobId}/rerank`);
  return data.candidates as Candidate[];
}

export async function deleteCandidatesApi(ids: string[]) {
  const { data } = await api.delete("/workspace/candidates", { data: { ids } });
  return data as { message: string; deleted: number; jobIds: string[] };
}

export async function deleteResumesApi(ids: string[]) {
  const { data } = await api.delete("/workspace/resumes", { data: { ids } });
  return data as { message: string; deleted: number; candidateIds: string[] };
}

export async function addToTalentPoolApi(
  entry: Omit<TalentPoolEntry, "id" | "savedAt"> & { actor?: string }
) {
  const { data } = await api.post("/workspace/talent-pool", entry);
  return data.entry as TalentPoolEntry;
}

export async function removeFromTalentPoolApi(id: string) {
  const { data } = await api.delete(`/workspace/talent-pool/${id}`);
  return data;
}

export async function postAuditLogApi(entry: {
  action: string;
  actor?: string;
  target?: string;
  details?: string;
  metadata?: Record<string, unknown>;
}) {
  const { data } = await api.post("/workspace/audit-logs", entry);
  return data.entry as AuditLogEntry;
}

export async function exportAuditLogsApi() {
  const { data } = await api.get("/workspace/audit-logs/export", { responseType: "blob" });
  return data as Blob;
}
