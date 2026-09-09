import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  AISettings,
  Candidate,
  CandidateStatus,
  Interview,
  Job,
  ResumeRecord,
  ScreeningResult,
  ToastMessage,
} from "@/types";
import { SEED_JOBS } from "@/data/seedJobs";
import { SEED_CANDIDATES, SEED_INTERVIEWS, SEED_RESUMES } from "@/data/seedCandidates";
import { DEFAULT_WEIGHTS } from "@/lib/scoring";
import { uid } from "@/lib/utils";

type WorkspaceState = {
  jobs: Job[];
  candidates: Candidate[];
  interviews: Interview[];
  resumes: ResumeRecord[];
  aiSettings: AISettings;
  toasts: ToastMessage[];
  authenticated: boolean;
  setAuthenticated: (v: boolean) => void;
  addJob: (job: Omit<Job, "id" | "createdAt">) => Job;
  updateJob: (id: string, patch: Partial<Job>) => void;
  ingestScreeningResults: (jobId: string, results: ScreeningResult[], fileNames?: string[]) => Candidate[];
  updateCandidateStatus: (id: string, status: CandidateStatus) => void;
  scheduleInterview: (candidateId: string, jobId: string) => void;
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  dismissToast: (id: string) => void;
  updateAISettings: (patch: Partial<AISettings>) => void;
  loadDemoSeed: () => void;
  addResumeRecords: (records: ResumeRecord[]) => void;
};

const STORAGE_KEY = "ai-recruit-workspace-v1";

const defaultAISettings: AISettings = {
  strongMatchMin: 90,
  goodMatchMin: 75,
  considerMin: 60,
  semanticMatching: true,
  explanationStyle: "detailed",
  defaultWeights: { ...DEFAULT_WEIGHTS },
};

const WorkspaceContext = createContext<WorkspaceState | null>(null);

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        jobs: parsed.jobs ?? SEED_JOBS,
        candidates: parsed.candidates ?? SEED_CANDIDATES,
        interviews: parsed.interviews ?? SEED_INTERVIEWS,
        resumes: parsed.resumes ?? SEED_RESUMES,
        aiSettings: parsed.aiSettings ?? defaultAISettings,
        authenticated: parsed.authenticated ?? false,
      };
    }
  } catch {
    /* ignore */
  }
  return {
    jobs: SEED_JOBS,
    candidates: SEED_CANDIDATES,
    interviews: SEED_INTERVIEWS,
    resumes: SEED_RESUMES,
    aiSettings: defaultAISettings,
    authenticated: false,
  };
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const initial = useMemo(() => loadInitial(), []);
  const [jobs, setJobs] = useState<Job[]>(initial.jobs);
  const [candidates, setCandidates] = useState<Candidate[]>(initial.candidates);
  const [interviews, setInterviews] = useState<Interview[]>(initial.interviews);
  const [resumes, setResumes] = useState<ResumeRecord[]>(initial.resumes);
  const [aiSettings, setAISettings] = useState<AISettings>(initial.aiSettings);
  const [authenticated, setAuthenticated] = useState(initial.authenticated);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ jobs, candidates, interviews, resumes, aiSettings, authenticated })
    );
  }, [jobs, candidates, interviews, resumes, aiSettings, authenticated]);

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = uid("toast");
    setToasts((t) => [...t, { ...toast, id }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const addJob = useCallback(
    (job: Omit<Job, "id" | "createdAt">) => {
      const created: Job = { ...job, id: uid("job"), createdAt: new Date().toISOString() };
      setJobs((j) => [created, ...j]);
      addToast({ title: "Job created successfully", type: "success" });
      return created;
    },
    [addToast]
  );

  const updateJob = useCallback((id: string, patch: Partial<Job>) => {
    setJobs((j) => j.map((job) => (job.id === id ? { ...job, ...patch } : job)));
  }, []);

  const ingestScreeningResults = useCallback(
    (jobId: string, results: ScreeningResult[], fileNames?: string[]) => {
      const now = new Date().toISOString();
      const mapped: Candidate[] = results.map((r, i) => ({
        ...r,
        id: uid("cand"),
        jobId,
        status: (r.decision === "Shortlisted"
          ? "shortlisted"
          : r.decision === "Review"
            ? "reviewed"
            : "ai_screened") as CandidateStatus,
        email: `${r.candidate_name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        location: "India",
        experienceYears: Math.max(0.5, Math.round((r.profile_score / 40) * 10) / 10),
        fileName: fileNames?.[i] ?? `${r.candidate_name.replace(/\s+/g, "_")}.pdf`,
        uploadedAt: now,
      }));

      setCandidates((prev) => {
        const others = prev.filter((c) => c.jobId !== jobId || !mapped.some((m) => m.candidate_name === c.candidate_name));
        const withoutDupes = others.filter(
          (c) => !(c.jobId === jobId && mapped.some((m) => m.candidate_name === c.candidate_name))
        );
        return [...mapped, ...withoutDupes];
      });

      setResumes((prev) => [
        ...mapped.map((c) => ({
          id: uid("res"),
          candidateId: c.id,
          candidateName: c.candidate_name,
          fileName: c.fileName ?? "resume.pdf",
          jobId,
          uploadedAt: now,
          status: "analyzed" as const,
          match: c.final_score,
        })),
        ...prev,
      ]);

      addToast({
        title: "Analysis completed",
        description: `${mapped.length} candidates screened`,
        type: "success",
      });
      return mapped;
    },
    [addToast]
  );

  const updateCandidateStatus = useCallback(
    (id: string, status: CandidateStatus) => {
      setCandidates((c) => c.map((x) => (x.id === id ? { ...x, status } : x)));
      const labels: Partial<Record<CandidateStatus, string>> = {
        shortlisted: "Candidate shortlisted",
        rejected: "Candidate rejected",
        interview: "Moved to interview",
        selected: "Candidate selected",
      };
      if (labels[status]) addToast({ title: labels[status]!, type: "success" });
    },
    [addToast]
  );

  const scheduleInterview = useCallback(
    (candidateId: string, jobId: string) => {
      setInterviews((prev) => [
        {
          id: uid("int"),
          candidateId,
          jobId,
          date: new Date(Date.now() + 3 * 86400000).toISOString(),
          type: "Technical",
          interviewer: "Rahul Mehta",
          status: "scheduled",
        },
        ...prev,
      ]);
      updateCandidateStatus(candidateId, "interview");
    },
    [updateCandidateStatus]
  );

  const updateAISettings = useCallback((patch: Partial<AISettings>) => {
    setAISettings((s) => ({ ...s, ...patch, defaultWeights: { ...s.defaultWeights, ...patch.defaultWeights } }));
  }, []);

  const loadDemoSeed = useCallback(() => {
    setJobs(SEED_JOBS);
    setCandidates(SEED_CANDIDATES);
    setInterviews(SEED_INTERVIEWS);
    setResumes(SEED_RESUMES);
    addToast({ title: "Demo data loaded", description: "Sample jobs and candidates ready", type: "info" });
  }, [addToast]);

  const addResumeRecords = useCallback((records: ResumeRecord[]) => {
    setResumes((r) => [...records, ...r]);
  }, []);

  const value: WorkspaceState = {
    jobs,
    candidates,
    interviews,
    resumes,
    aiSettings,
    toasts,
    authenticated,
    setAuthenticated,
    addJob,
    updateJob,
    ingestScreeningResults,
    updateCandidateStatus,
    scheduleInterview,
    addToast,
    dismissToast,
    updateAISettings,
    loadDemoSeed,
    addResumeRecords,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
