import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  AISettings,
  Candidate,
  CandidateStatus,
  Interview,
  Job,
  RecruiterUser,
  ResumeRecord,
  ScreeningResult,
  ToastMessage,
} from "@/types";
import {
  fetchCurrentRecruiter,
  loginRecruiter,
  logoutRecruiter,
  restoreRecruiterSession,
} from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { DEFAULT_WEIGHTS } from "@/lib/scoring";
import { uid } from "@/lib/utils";
import { getApiDisplayUrl, isUsingLocalApi } from "@/lib/api";
import {
  createJobApi,
  deleteCandidatesApi,
  deleteResumesApi,
  fetchWorkspace,
  rerankJobApi,
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
  recruiter: RecruiterUser | null;
  authenticated: boolean;
  authLoading: boolean;
  dbEnabled: boolean;
  dbLoading: boolean;
  demoMode: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  startDemoSession: () => void;
  exitDemoSession: () => Promise<void>;
  loadDemoSeed: () => void;
  refreshFromDb: () => Promise<void>;
  addJob: (job: Omit<Job, "id" | "createdAt">) => Promise<Job>;
  updateJob: (id: string, patch: Partial<Job>) => void;
  ingestScreeningResults: (
    jobId: string,
    results: ScreeningResult[],
    fileNames?: string[],
    append?: boolean
  ) => Promise<Candidate[]>;
  updateCandidateStatus: (id: string, status: CandidateStatus) => Promise<void>;
  deleteCandidates: (ids: string[]) => Promise<number>;
  deleteResumes: (ids: string[]) => Promise<number>;
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
  biasBlindMode: false,
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
        aiSettings: { ...defaultAISettings, ...(parsed.aiSettings ?? {}) },
        demoMode: parsed.demoMode ?? false,
      };
    }
  } catch {
    /* ignore */
  }
  return { aiSettings: defaultAISettings, demoMode: false };
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const initial = useMemo(() => loadSettings(), []);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [aiSettings, setAISettings] = useState<AISettings>(initial.aiSettings);
  const [recruiter, setRecruiter] = useState<RecruiterUser | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(initial.demoMode);
  const [dbEnabled, setDbEnabled] = useState(false);
  const [dbLoading, setDbLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ aiSettings, demoMode })
    );
  }, [aiSettings, demoMode]);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const user = await restoreRecruiterSession();
        if (!active) return;

        if (user) {
          setRecruiter(user);
          setAuthenticated(true);
          setDemoMode(false);
        } else {
          setRecruiter(null);
          setAuthenticated(false);
        }
      } catch {
        if (active) {
          setRecruiter(null);
          setAuthenticated(false);
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    };

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setRecruiter(null);
        setAuthenticated(false);
        setDemoMode(false);
        return;
      }

      if (
        session?.access_token &&
        (event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "INITIAL_SESSION")
      ) {
        const user = await fetchCurrentRecruiter();
        if (user) {
          setRecruiter(user);
          setAuthenticated(true);
          setDemoMode(false);
        }
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

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
    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const data = await fetchWorkspace();
        setDbEnabled(data.dbEnabled);
        setJobs(data.jobs);
        setCandidates(data.candidates);
        setInterviews(data.interviews);
        setResumes(data.resumes);
        setDbLoading(false);
        return;
      } catch (error) {
        lastError = error;
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 12000));
        }
      }
    }

    setDbEnabled(false);
    const apiUrl = getApiDisplayUrl();
    const description =
      isUsingLocalApi() && import.meta.env.PROD
        ? `Production app is calling ${apiUrl}. Redeploy Vercel with VITE_API_BASE=/api.`
        : `Could not reach ${apiUrl}. Render free tier may take up to 60s to wake up — click Retry.`;
    addToast({
      title: "Could not load workspace",
      description,
      type: "error",
    });
    console.error("Workspace load failed:", lastError);
    setDbLoading(false);
  }, [addToast]);

  const loadDemoSeed = useCallback(() => {
    setDemoMode(true);
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

  const login = useCallback(
    async (email: string, password: string, remember = true) => {
      const session = await loginRecruiter(email, password, remember);
      setRecruiter(session.user);
      setAuthenticated(true);
      setDemoMode(false);
      addToast({
        title: `Welcome back, ${session.user.name}`,
        description: "Your recruitment workspace is ready.",
        type: "success",
      });
    },
    [addToast]
  );

  const logout = useCallback(async () => {
    await logoutRecruiter();
    setRecruiter(null);
    setAuthenticated(false);
    setDemoMode(false);
    setJobs([]);
    setCandidates([]);
    setInterviews([]);
    setResumes([]);
    setDbEnabled(false);
    addToast({
      title: "Signed out",
      description: "You have been logged out of the recruiter portal.",
      type: "info",
    });
  }, [addToast]);

  const startDemoSession = useCallback(() => {
    setDemoMode(true);
    setAuthenticated(true);
    setRecruiter({
      id: "demo",
      email: "demo@airecruit.app",
      name: "Demo Recruiter",
      role: "Senior Recruiter",
      initials: "DR",
      department: "Talent Acquisition",
    });
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
        description: "Changes in this session won't be saved after refresh.",
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
    async (jobId: string, results: ScreeningResult[], fileNames?: string[], append = false) => {
      if (dbEnabled && !demoMode) {
        await saveScreeningResultsApi(jobId, results, fileNames, append);
        await rerankJobApi(jobId);
        await refreshFromDb();
        addToast({
          title: "Analysis completed",
          description: `${results.length} candidates saved`,
          type: "success",
        });
        return results as Candidate[];
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
        const base = append ? prev : prev.filter((c) => c.jobId !== jobId);
        const withoutDupes = base.filter(
          (c) => !(c.jobId === jobId && mapped.some((m) => m.candidate_name === c.candidate_name))
        );
        const merged = [...mapped, ...withoutDupes];
        return merged
          .filter((c) => c.jobId === jobId)
          .sort((a, b) => b.final_score - a.final_score)
          .map((c, i) => ({ ...c, rank: i + 1 }))
          .concat(merged.filter((c) => c.jobId !== jobId));
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

  const deleteCandidates = useCallback(
    async (ids: string[]) => {
      const uniqueIds = [...new Set(ids.filter(Boolean))];
      if (uniqueIds.length === 0) return 0;

      if (dbEnabled && !demoMode) {
        const result = await deleteCandidatesApi(uniqueIds);
        await refreshFromDb();
        addToast({
          title: "Candidates deleted",
          description: `${result.deleted} removed from the workspace`,
          type: "success",
        });
        return result.deleted;
      }

      setCandidates((prev) => prev.filter((c) => !uniqueIds.includes(c.id)));
      setInterviews((prev) => prev.filter((i) => !uniqueIds.includes(i.candidateId)));
      setResumes((prev) => prev.filter((r) => !r.candidateId || !uniqueIds.includes(r.candidateId)));
      addToast({
        title: "Candidates deleted",
        description: `${uniqueIds.length} removed from this session`,
        type: "success",
      });
      return uniqueIds.length;
    },
    [addToast, dbEnabled, demoMode, refreshFromDb]
  );

  const deleteResumes = useCallback(
    async (ids: string[]) => {
      const uniqueIds = [...new Set(ids.filter(Boolean))];
      if (uniqueIds.length === 0) return 0;

      if (dbEnabled && !demoMode) {
        const result = await deleteResumesApi(uniqueIds);
        await refreshFromDb();
        addToast({
          title: "Resumes deleted",
          description: `${result.deleted} removed from the library`,
          type: "success",
        });
        return result.deleted;
      }

      const linkedCandidateIds = resumes
        .filter((r) => uniqueIds.includes(r.id) && r.candidateId)
        .map((r) => r.candidateId as string);

      setResumes((prev) => prev.filter((r) => !uniqueIds.includes(r.id)));
      if (linkedCandidateIds.length > 0) {
        const uniqueCandidateIds = [...new Set(linkedCandidateIds)];
        setCandidates((prev) => prev.filter((c) => !uniqueCandidateIds.includes(c.id)));
        setInterviews((prev) => prev.filter((i) => !uniqueCandidateIds.includes(i.candidateId)));
      }

      addToast({
        title: "Resumes deleted",
        description: `${uniqueIds.length} removed from this session`,
        type: "success",
      });
      return uniqueIds.length;
    },
    [addToast, dbEnabled, demoMode, refreshFromDb, resumes]
  );

  const scheduleInterview = useCallback(
    async (candidateId: string, jobId: string) => {
      if (dbEnabled && !demoMode) {
        await scheduleInterviewApi(candidateId, jobId, "Technical", recruiter?.name ?? "Recruiter");
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
          interviewer: recruiter?.name ?? "Recruiter",
          status: "scheduled",
        },
        ...prev,
      ]);
      await updateCandidateStatus(candidateId, "interview");
    },
    [addToast, dbEnabled, demoMode, recruiter?.name, refreshFromDb, updateCandidateStatus]
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
    recruiter,
    authenticated,
    authLoading,
    dbEnabled,
    dbLoading,
    demoMode,
    login,
    logout,
    startDemoSession,
    exitDemoSession,
    loadDemoSeed,
    refreshFromDb,
    addJob,
    updateJob,
    ingestScreeningResults,
    updateCandidateStatus,
    deleteCandidates,
    deleteResumes,
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
