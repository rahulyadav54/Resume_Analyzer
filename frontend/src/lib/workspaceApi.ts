import { api } from "@/lib/api";
import type { Candidate, CandidateStatus, Interview, Job, ResumeRecord, ScreeningResult } from "@/types";

export type WorkspaceData = {
  dbEnabled: boolean;
  jobs: Job[];
  candidates: Candidate[];
  interviews: Interview[];
  resumes: ResumeRecord[];
};

export async function fetchWorkspace(): Promise<WorkspaceData> {
  const { data } = await api.get("/workspace");
  return {
    dbEnabled: Boolean(data.dbEnabled),
    jobs: data.jobs ?? [],
    candidates: data.candidates ?? [],
    interviews: data.interviews ?? [],
    resumes: data.resumes ?? [],
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
  interviewer = "Rahul Mehta"
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
  fileNames?: string[]
) {
  const { data } = await api.post("/workspace/screening-results", {
    jobId,
    results,
    fileNames,
  });
  return data.candidates as Candidate[];
}
