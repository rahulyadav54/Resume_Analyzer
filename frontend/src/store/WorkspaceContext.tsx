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
import { DEFAULT_WEIGHTS } from "@/lib/scoring";
import { uid } from "@/lib/utils";
import {
  createJobApi,
  fetchWorkspace,
  saveScreeningResultsApi,
  scheduleInterviewApi,
  updateCandidateStatusApi,
} from "@/lib/workspaceApi";
import { SEED_CANDIDATES, SEED_INTERVIEWS, SEED_RESUMES } from "@/data/seedCandidates";
import { SEED_JOBS } from "@/data/seedJobs";

type WorkspaceState = {
  jobs: Job[];
  candidates: Candidate[];
  interviews: Interview[];
  resumes: ResumeRecord[];
  aiSettings: AISettings;
  toasts: ToastMessage[];
  authenticated: boolean;
  dbEnabled: boolean;
  dbLoading: boolean;
  demoMode: boolean;
  setAuthenticated: (v: boolean) => void;
  enterWorkspace: () => void;
  startDemoSession: () => void;
  exitDemoSession: () => Promise<void>;
  loadDemoSeed: () => void;
  refreshFromDb: () => Promise<void>;
  addJob: (job: Omit<Job, "id" | "createdAt">) => Promise<Job>;
  updateJob: (id: string, patch: Partial<Job>) => void;
  ingestScreeningResults: (jobId: string, results: ScreeningResult[], fileNames?: string[]) => Promise<Candidate[]>;
  updateCandidateStatus: (id: string, status: CandidateStatus) => Promise<void>;
  scheduleInterview: (candidateId: string, jobId: string) => Promise<void>;
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  dismissToast: (id: string) => void;
  updateAISettings: (patch: Partial<AISettings>) => void;
  addResumeRecords: (records: ResumeRecord[]) => void;
};

const SETTINGS_KEY = "ai-recruit-settings-v2";

const defaultAISettings: AISettings = {
  strongMatchMin: 90,
  goodMatchMin: 75,
  considerMin: 60,
  semanticMatching: true,
  explanationStyle: "detailed",
  defaultWeights: { ...DEFAULT_WEIGHTS },
};

const WorkspaceContext = createContext<WorkspaceState | null>(null);

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        aiSettings: parsed.aiSettings ?? defaultAISettings,
        authenticated: parsed.authenticated ?? false,
        demoMode: parsed.demoMode ?? false,
      };
    }
  } catch {
    /* ignore */
  }
  return { aiSettings: defaultAISettings, authenticated: false, demoMode: false };
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const initial = useMemo(() => loadSettings(), []);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [aiSettings, setAISettings] = useState<AISettings>(initial.aiSettings);
  const [authenticated, setAuthenticated] = useState(initial.authenticated);
  const [demoMode, setDemoMode] = useState(initial.demoMode);
  const [dbEnabled, setDbEnabled] = useState(false);
  const [dbLoading, setDbLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ aiSettings, authenticated, demoMode })
    );
  }, [aiSettings, authenticated, demoMode]);

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = uid("toast");
    setToasts((t) => [...t, { ...toast, id }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const refreshFromDb = useCallback(async () => {
    setDbLoading(true);
    try {
      const data = await fetchWorkspace();
      setDbEnabled(data.dbEnabled);
      setJobs(data.jobs);
      setCandidates(data.candidates);
      setInterviews(data.interviews);
      setResumes(data.resumes);
    } catch {
      setDbEnabled(false);
      addToast({
        title: "Could not load workspace",
        description: "Check that the backend is running and Supabase is configured.",
        type: "error",
      });
    } finally {
      setDbLoading(false);
    }
  }, [addToast]);

  const loadDemoSeed = useCallback(() => {
    setJobs(SEED_JOBS);
    setCandidates(SEED_CANDIDATES);
    setInterviews(SEED_INTERVIEWS);
    setResumes(SEED_RESUMES);
    addToast({
      title: "Demo data loaded",
      description: "Sample jobs, candidates, and interviews are ready.",
      type: "info",
    });
  }, [addToast]);

  const enterWorkspace = useCallback(() => {
    setDemoMode(false);
    setAuthenticated(true);
  }, []);

  const startDemoSession = useCallback(() => {
    setDemoMode(true);
    setAuthenticated(true);
    loadDemoSeed();
  }, [loadDemoSeed]);

  const exitDemoSession = useCallback(async () => {
    setDemoMode(false);
    setJobs([]);
    setCandidates([]);
    setInterviews([]);
    setResumes([]);
    await refreshFromDb();
    addToast({
      title: "Exited demo session",
      description: "Showing your live workspace data.",
      type: "info",
    });
  }, [addToast, refreshFromDb]);

  useEffect(() => {
    if (!authenticated) {
      setJobs([]);
      setCandidates([]);
      setInterviews([]);
      setResumes([]);
      setDbEnabled(false);
      return;
    }

    if (demoMode) {
      setJobs(SEED_JOBS);
      setCandidates(SEED_CANDIDATES);
      setInterviews(SEED_INTERVIEWS);
      setResumes(SEED_RESUMES);
      fetchWorkspace()
        .then((data) => setDbEnabled(data.dbEnabled))
        .catch(() => setDbEnabled(false));
      return;
    }

    refreshFromDb();
  }, [authenticated, demoMode, refreshFromDb]);

  const addJob = useCallback(
    async (job: Omit<Job, "id" | "createdAt">) => {
      if (dbEnabled && !demoMode) {
        const created = await createJobApi(job);
        setJobs((j) => [created, ...j]);
        addToast({ title: "Job created successfully", type: "success" });
        return created;
      }

      const created: Job = { ...job, id: uid("job"), createdAt: new Date().toISOString() };
      setJobs((j) => [created, ...j]);
      addToast({
        title: "Job created (session only)",
        description: "Connect Supabase on the backend to persist jobs.",
        type: "info",
      });
      return created;
    },
    [addToast, dbEnabled, demoMode]
  );

  const updateJob = useCallback((id: string, patch: Partial<Job>) => {
    setJobs((j) => j.map((job) => (job.id === id ? { ...job, ...patch } : job)));
  }, []);

  const ingestScreeningResults = useCallback(
    async (jobId: string, results: ScreeningResult[], fileNames?: string[]) => {
      if (dbEnabled && !demoMode) {
        const saved = await saveScreeningResultsApi(jobId, results, fileNames);
        await refreshFromDb();
        addToast({
          title: "Analysis completed",
          description: `${saved.length} candidates saved`,
          type: "success",
        });
        return saved;
      }

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
        email: undefined,
        location: undefined,
        experienceYears: Math.max(0.5, Math.round((r.profile_score / 40) * 10) / 10),
        fileName: fileNames?.[i] ?? `${r.candidate_name.replace(/\s+/g, "_")}.pdf`,
        uploadedAt: now,
      }));

      setCandidates((prev) => {
        const withoutDupes = prev.filter(
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
        description: `${mapped.length} candidates screened (session only)`,
        type: "success",
      });
      return mapped;
    },
    [addToast, dbEnabled, demoMode, refreshFromDb]
  );

  const updateCandidateStatus = useCallback(
    async (id: string, status: CandidateStatus) => {
      if (dbEnabled && !demoMode) {
        await updateCandidateStatusApi(id, status);
        await refreshFromDb();
      } else {
        setCandidates((c) => c.map((x) => (x.id === id ? { ...x, status } : x)));
      }

      const labels: Partial<Record<CandidateStatus, string>> = {
        shortlisted: "Candidate shortlisted",
        rejected: "Candidate rejected",
        interview: "Moved to interview",
        selected: "Candidate selected",
      };
      if (labels[status]) addToast({ title: labels[status]!, type: "success" });
    },
    [addToast, dbEnabled, demoMode, refreshFromDb]
  );

  const scheduleInterview = useCallback(
    async (candidateId: string, jobId: string) => {
      if (dbEnabled && !demoMode) {
        await scheduleInterviewApi(candidateId, jobId);
        await refreshFromDb();
        addToast({ title: "Moved to interview", type: "success" });
        return;
      }

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
      await updateCandidateStatus(candidateId, "interview");
    },
    [addToast, dbEnabled, demoMode, refreshFromDb, updateCandidateStatus]
  );

  const updateAISettings = useCallback((patch: Partial<AISettings>) => {
    setAISettings((s) => ({
      ...s,
      ...patch,
      defaultWeights: { ...s.defaultWeights, ...patch.defaultWeights },
    }));
  }, []);

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
    dbEnabled,
    dbLoading,
    demoMode,
    setAuthenticated,
    enterWorkspace,
    startDemoSession,
    exitDemoSession,
    loadDemoSeed,
    refreshFromDb,
    addJob,
    updateJob,
    ingestScreeningResults,
    updateCandidateStatus,
    scheduleInterview,
    addToast,
    dismissToast,
    updateAISettings,
    addResumeRecords,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
