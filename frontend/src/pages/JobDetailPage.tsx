import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  Download,
  MoreHorizontal,
  Trash2,
  Upload as UploadIcon,
} from "lucide-react";
import { PageHeader, PageBody } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/MetricCard";
import { UploadZone } from "@/components/jobs/UploadZone";
import { MatchScore } from "@/components/candidates/MatchScore";
import { SkillBadge, StatusBadge } from "@/components/candidates/StatusBadge";
import { useWorkspace } from "@/store/WorkspaceContext";
import {
  analyzeJobDescription,
  downloadResultsCsv,
  runDemoScreening,
  screenResumesInBatches,
  type BatchProgress,
} from "@/lib/api";
import { downloadCandidateReport } from "@/lib/candidateReport";
import { MAX_RESUMES_PER_JOB, RESUME_BATCH_SIZE } from "@/lib/screeningLimits";
import { uid } from "@/lib/utils";
import type { Candidate, JdQuality, Job, TriageSummary } from "@/types";

const tabs = [
  "Overview",
  "Candidates",
  "Shortlisted",
  "Interviews",
  "Job Description",
  "Analytics",
] as const;

type Tab = (typeof tabs)[number];

export function JobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const {
    jobs,
    candidates,
    interviews,
    ingestScreeningResults,
    addResumeRecords,
    addToast,
    dbEnabled,
    demoMode,
    refreshFromDb,
    deleteCandidates,
    aiSettings,
  } = useWorkspace();
  const job = jobs.find((j) => j.id === jobId);
  const [tab, setTab] = useState<Tab>("Candidates");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("match");
  const [selected, setSelected] = useState<string[]>([]);
  const [processing, setProcessing] = useState<string[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [jdQuality, setJdQuality] = useState<JdQuality | null>(null);
  const [screeningAlerts, setScreeningAlerts] = useState<string[]>([]);
  const [triageSummary, setTriageSummary] = useState<TriageSummary | null>(null);

  useEffect(() => {
    if (!job?.description) return;
    analyzeJobDescription(job.description, job.requiredSkills.join(", "))
      .then(setJdQuality)
      .catch(() => setJdQuality(null));
  }, [job?.id, job?.description, job?.requiredSkills]);

  const existingCandidateCount = useMemo(
    () => candidates.filter((c) => c.jobId === jobId).length,
    [candidates, jobId]
  );

  const remainingSlots = MAX_RESUMES_PER_JOB - existingCandidateCount;

  const queueBulkFiles = (incoming: File[]) => {
    if (incoming.length === 0) return;

    const dedupeKey = (file: File) => `${file.name}:${file.size}`;
    const seen = new Set(pendingFiles.map(dedupeKey));
    const uniqueIncoming = incoming.filter((file) => {
      const key = dedupeKey(file);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const combined = [...pendingFiles, ...uniqueIncoming];
    if (combined.length > remainingSlots) {
      addToast({
        title: "Upload limit reached",
        description: `You can add up to ${remainingSlots} more resumes for this job.`,
        type: "error",
      });
      setPendingFiles(combined.slice(0, remainingSlots));
      return;
    }

    setPendingFiles(combined);
    addToast({
      title: `${uniqueIncoming.length} file${uniqueIncoming.length === 1 ? "" : "s"} queued`,
      description: `${combined.length} resume${combined.length === 1 ? "" : "s"} ready for screening`,
      type: "info",
    });
  };

  const startBulkScreening = () => {
    if (pendingFiles.length === 0) {
      addToast({ title: "No resumes selected", description: "Add files before screening.", type: "info" });
      return;
    }
    screenMutation.mutate(pendingFiles);
  };

  const jobCandidates = useMemo(() => {
    let list = candidates.filter((c) => c.jobId === jobId);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.candidate_name.toLowerCase().includes(q) ||
          c.extracted_skills.some((s) => s.includes(q)) ||
          c.education.some((e) => e.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== "all") list = list.filter((c) => c.status === statusFilter);
    list = [...list].sort((a, b) => {
      if (sort === "newest") return +new Date(b.uploadedAt) - +new Date(a.uploadedAt);
      if (sort === "experience") return (b.experienceYears ?? 0) - (a.experienceYears ?? 0);
      return b.final_score - a.final_score;
    });
    return list;
  }, [candidates, jobId, search, statusFilter, sort]);

  const screenMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (existingCandidateCount + files.length > MAX_RESUMES_PER_JOB) {
        throw new Error(
          `This job has ${existingCandidateCount} candidates. You can add up to ${
            MAX_RESUMES_PER_JOB - existingCandidateCount
          } more resumes (max ${MAX_RESUMES_PER_JOB} per job).`
        );
      }

      const appendToJob = existingCandidateCount > 0;
      setProcessing(files.map((f) => f.name));
      addResumeRecords(
        files.map((f) => ({
          id: uid("res"),
          candidateName: f.name.replace(/\.[^.]+$/, "").replace(/_/g, " "),
          fileName: f.name,
          jobId: jobId!,
          uploadedAt: new Date().toISOString(),
          status: "analyzing",
        }))
      );
      const data = await screenResumesInBatches(
        {
          jobDescription: job!.description,
          requiredSkills: job!.requiredSkills.join(", "),
          files,
          jobId: dbEnabled && !demoMode ? jobId! : undefined,
          append: appendToJob,
          biasBlindMode: aiSettings.biasBlindMode,
        },
        setBatchProgress
      );
      return { data, files, appendToJob };
    },
    onSuccess: async ({ data, files, appendToJob }) => {
      if (data.jd_quality) setJdQuality(data.jd_quality);
      if (data.triage_summary) setTriageSummary(data.triage_summary);
      setScreeningAlerts((data.duplicate_alerts ?? []).map((a) => a.message));
      if (!dbEnabled || demoMode) {
        await ingestScreeningResults(
          jobId!,
          data.results,
          files.map((f) => f.name),
          appendToJob
        );
      } else {
        await refreshFromDb();
        addToast({
          title: "Analysis completed",
          description: `${data.results.length} candidates screened and ranked`,
          type: "success",
        });
      }
      setProcessing([]);
      setBatchProgress(null);
      setPendingFiles([]);
      setShowUpload(false);
      setTab("Candidates");
    },
    onError: (error: Error) => {
      setProcessing([]);
      setBatchProgress(null);
      addToast({
        title: "Resume processing failed",
        description: error.message || "Please try again with a smaller batch.",
        type: "error",
      });
    },
  });

  const demoMutation = useMutation({
    mutationFn: () =>
      runDemoScreening({
        jobDescription: job!.description,
        requiredSkills: job!.requiredSkills.join(", "),
        jobId: job!.id,
        biasBlindMode: aiSettings.biasBlindMode,
      }),
    onSuccess: async (data) => {
      if (data.jd_quality) setJdQuality(data.jd_quality);
      if (data.triage_summary) setTriageSummary(data.triage_summary);
      setScreeningAlerts((data.duplicate_alerts ?? []).map((a) => a.message));
      const fileNames = data.results.map((r) => `${r.candidate_name.replace(/\s+/g, "_")}.txt`);
      await ingestScreeningResults(jobId!, data.results, fileNames);
      setTab("Candidates");
    },
    onError: () =>
      addToast({
        title: "Demo screening failed",
        description: "Start the backend and ensure sample resumes exist in resumes/",
        type: "error",
      }),
  });

  if (!job) {
    return (
      <>
        <PageHeader title="Job not found" />
        <PageBody>
          <EmptyState
            title="Job not found"
            description="This job may have been removed."
            action={
              <Link to="/jobs">
                <Button size="sm">Back to Jobs</Button>
              </Link>
            }
          />
        </PageBody>
      </>
    );
  }

  const shortlisted = jobCandidates.filter((c) =>
    ["shortlisted", "interview", "selected"].includes(c.status)
  );
  const jobInterviews = interviews.filter((i) => i.jobId === jobId);

  const exportCsv = () => {
    downloadResultsCsv(
      jobCandidates.map((c) => ({
        Rank: c.rank,
        Candidate: c.candidate_name,
        Score: c.final_score,
        Status: c.status,
        Matched: c.matched_skills.join(" | "),
        Missing: c.missing_skills.join(" | "),
        Decision: c.decision,
      }))
    );
    addToast({ title: "Export ready", type: "success" });
  };

  const toggleSelect = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const toggleSelectAll = (candidateIds: string[], checked: boolean) => {
    if (!checked) {
      setSelected((s) => s.filter((id) => !candidateIds.includes(id)));
      return;
    }
    setSelected((s) => [...new Set([...s, ...candidateIds])]);
  };

  const handleDeleteSelected = async (ids: string[]) => {
    if (ids.length === 0) {
      addToast({ title: "No candidates selected", description: "Select candidates to delete.", type: "info" });
      return;
    }
    if (
      !window.confirm(
        `Delete ${ids.length} candidate${ids.length === 1 ? "" : "s"}? This cannot be undone.`
      )
    ) {
      return;
    }
    await deleteCandidates(ids);
    setSelected((s) => s.filter((id) => !ids.includes(id)));
  };

  return (
    <>
      <PageHeader
        title={job.title}
        subtitle={`${job.department} · ${job.employmentType} · ${jobCandidates.length} applicants`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={job.status === "active" ? "success" : "warning"}>{job.status.toUpperCase()}</Badge>
            <Button variant="secondary" size="sm" onClick={() => setShowUpload((v) => !v)}>
              <UploadIcon size={14} /> Bulk Upload
            </Button>
            <Button variant="secondary" size="sm" onClick={exportCsv}>
              <Download size={14} /> Export
            </Button>
            <Button variant="ghost" size="sm" aria-label="More">
              <MoreHorizontal size={16} />
            </Button>
          </div>
        }
      />
      <PageBody>
        <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition ${
                tab === t
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {triageSummary && (
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            <Card className="border-emerald-200 bg-emerald-50/40">
              <CardBody className="p-4">
                <p className="text-xs font-medium text-emerald-700">Immediate review</p>
                <p className="text-2xl font-semibold text-slate-900">{triageSummary.immediate_count}</p>
              </CardBody>
            </Card>
            <Card className="border-amber-200 bg-amber-50/40">
              <CardBody className="p-4">
                <p className="text-xs font-medium text-amber-700">Review queue</p>
                <p className="text-2xl font-semibold text-slate-900">{triageSummary.queue_count}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="p-4">
                <p className="text-xs font-medium text-slate-500">Auto-archived</p>
                <p className="text-2xl font-semibold text-slate-900">{triageSummary.archive_count}</p>
              </CardBody>
            </Card>
            <Card className="border-brand-200 bg-brand-50/40">
              <CardBody className="p-4">
                <p className="text-xs font-medium text-brand-700">Hours saved</p>
                <p className="text-2xl font-semibold text-slate-900">{triageSummary.estimated_hours_saved}h</p>
              </CardBody>
            </Card>
          </div>
        )}

        {screeningAlerts.length > 0 && (
          <div className="mb-4 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">Duplicate applications detected</p>
            <ul className="mt-1 list-disc pl-5 text-xs">
              {screeningAlerts.map((alert) => (
                <li key={alert}>{alert}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-4 rounded-[10px] border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
          <strong>Standardized scoring rubric v1.0</strong> — every candidate uses the same locked 60/25/15
          weights for consistent, auditable screening.
        </div>

        {aiSettings.biasBlindMode && (
          <div className="mb-4 rounded-[10px] border border-brand-200 bg-brand-50 px-4 py-2 text-sm text-brand-800">
            Bias-blind screening is <strong>ON</strong> — candidates are scored on skills only, without identity cues.
          </div>
        )}

        {showUpload && (
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Bulk Resume Upload</h3>
                  <p className="text-xs text-slate-500">
                    Drop files or upload a folder — up to {remainingSlots} more resumes ({RESUME_BATCH_SIZE} per
                    batch).
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={demoMutation.isPending}
                  onClick={() => demoMutation.mutate()}
                >
                  Run Demo Screening
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <UploadZone
                onFiles={queueBulkFiles}
                disabled={screenMutation.isPending || remainingSlots === 0}
                label="Drop resumes or a folder here"
                hint={`PDF, DOCX, or TXT · ${pendingFiles.length} queued · ${remainingSlots} slots left`}
              />

              {pendingFiles.length > 0 && (
                <div className="mt-4 rounded-lg border border-border bg-white">
                  <div className="flex items-center justify-between border-b border-border px-3 py-2">
                    <p className="text-xs font-semibold text-slate-700">
                      {pendingFiles.length} resume{pendingFiles.length === 1 ? "" : "s"} queued
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={screenMutation.isPending}
                      onClick={() => setPendingFiles([])}
                    >
                      Clear all
                    </Button>
                  </div>
                  <ul className="max-h-40 overflow-y-auto px-3 py-2 text-xs text-slate-600">
                    {pendingFiles.slice(0, 12).map((file) => (
                      <li key={`${file.name}-${file.size}`} className="truncate py-0.5">
                        {file.name}
                      </li>
                    ))}
                    {pendingFiles.length > 12 && (
                      <li className="py-0.5 text-slate-400">+ {pendingFiles.length - 12} more files</li>
                    )}
                  </ul>
                  <div className="border-t border-border px-3 py-2">
                    <Button
                      size="sm"
                      disabled={screenMutation.isPending}
                      onClick={startBulkScreening}
                    >
                      Screen {pendingFiles.length} Resume{pendingFiles.length === 1 ? "" : "s"}
                    </Button>
                  </div>
                </div>
              )}

              {(processing.length > 0 || batchProgress) && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs font-medium text-slate-600">
                    {batchProgress
                      ? `Processing batch ${batchProgress.batch} of ${batchProgress.totalBatches} · ${batchProgress.processedFiles}/${batchProgress.totalFiles} resumes`
                      : "Uploading → Extracting text → Analyzing skills → Matching → Ranking…"}
                  </p>
                  {batchProgress && (
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-600 transition-all"
                        style={{
                          width: `${Math.round(
                            (batchProgress.processedFiles / batchProgress.totalFiles) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                  {processing.map((name) => (
                    <div
                      key={name}
                      className="flex items-center justify-between rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span>{name}</span>
                      <span className="text-xs text-brand-600">Analyzing…</span>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {tab === "Overview" && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <h3 className="text-sm font-semibold">Role summary</h3>
              </CardHeader>
              <CardBody>
                <p className="whitespace-pre-wrap text-sm text-slate-700">{job.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {job.requiredSkills.map((s) => (
                    <SkillBadge key={s} skill={s} tone="brand" />
                  ))}
                </div>
              </CardBody>
            </Card>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-semibold">Pipeline</h3>
                </CardHeader>
                <CardBody className="space-y-2 text-sm">
                  <Row label="Applicants" value={jobCandidates.length} />
                  <Row label="Shortlisted" value={shortlisted.length} />
                  <Row label="Interviews" value={jobInterviews.length} />
                  <Row label="Location" value={job.location} />
                  <Row label="Experience" value={job.experience} />
                </CardBody>
              </Card>
              {jdQuality && (
                <Card>
                  <CardHeader>
                    <h3 className="text-sm font-semibold">JD Quality Score</h3>
                  </CardHeader>
                  <CardBody className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-semibold text-slate-900">{jdQuality.jd_quality_score}%</span>
                      <Badge tone={jdQuality.jd_quality_score >= 75 ? "success" : "warning"}>
                        {jdQuality.clarity_rating}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">{jdQuality.summary}</p>
                    {jdQuality.suggestions.length > 0 && (
                      <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600">
                        {jdQuality.suggestions.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    )}
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        )}

        {tab === "Candidates" && (
          <CandidatesTab
            candidates={jobCandidates}
            job={job}
            jobId={job.id}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sort={sort}
            setSort={setSort}
            selected={selected}
            toggleSelect={toggleSelect}
            onCompare={() => {
              if (selected.length >= 2) {
                navigate(`/jobs/${job.id}/compare?ids=${selected.join(",")}`);
              } else {
                addToast({ title: "Select at least 2 candidates", type: "info" });
              }
            }}
            onOpenUpload={() => setShowUpload(true)}
            onDeleteSelected={() => handleDeleteSelected(selected)}
            onSelectAll={(checked) => toggleSelectAll(jobCandidates.map((c) => c.id), checked)}
          />
        )}

        {tab === "Shortlisted" && (
          <CandidateTable
            candidates={shortlisted}
            job={job}
            jobId={job.id}
            empty="No shortlisted candidates yet."
            onDelete={(id) => handleDeleteSelected([id])}
          />
        )}

        {tab === "Interviews" && (
          <Card>
            <CardBody>
              {jobInterviews.length === 0 ? (
                <p className="text-sm text-slate-500">No interviews scheduled for this role.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-slate-500">
                    <tr>
                      <th className="pb-2 font-medium">Candidate</th>
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Interviewer</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobInterviews.map((i) => {
                      const c = candidates.find((x) => x.id === i.candidateId);
                      return (
                        <tr key={i.id} className="border-t border-border">
                          <td className="py-2.5">{c?.candidate_name ?? "—"}</td>
                          <td className="py-2.5">{new Date(i.date).toLocaleString()}</td>
                          <td className="py-2.5">{i.type}</td>
                          <td className="py-2.5">{i.interviewer}</td>
                          <td className="py-2.5">
                            <Badge tone="brand">{i.status}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        )}

        {tab === "Job Description" && (
          <Card>
            <CardBody className="space-y-4">
              <p className="whitespace-pre-wrap text-sm text-slate-700">{job.description}</p>
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-500">Required</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.requiredSkills.map((s) => (
                    <SkillBadge key={s} skill={s} tone="brand" />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-500">Preferred</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.preferredSkills.map((s) => (
                    <SkillBadge key={s} skill={s} />
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {tab === "Analytics" && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Applicants" value={jobCandidates.length} />
            <Stat
              label="Avg match score"
              value={
                jobCandidates.length
                  ? Math.round(
                      jobCandidates.reduce((a, c) => a + c.final_score, 0) / jobCandidates.length
                    )
                  : 0
              }
            />
            <Stat label="Shortlist rate" value={`${jobCandidates.length ? Math.round((shortlisted.length / jobCandidates.length) * 100) : 0}%`} />
          </div>
        )}
      </PageBody>
    </>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[10px] border border-border bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function CandidatesTab({
  candidates,
  job,
  jobId,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  sort,
  setSort,
  selected,
  toggleSelect,
  onCompare,
  onOpenUpload,
  onDeleteSelected,
  onSelectAll,
}: {
  candidates: Candidate[];
  job: Job;
  jobId: string;
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  sort: string;
  setSort: (v: string) => void;
  selected: string[];
  toggleSelect: (id: string) => void;
  onCompare: () => void;
  onOpenUpload: () => void;
  onDeleteSelected: () => void;
  onSelectAll: (checked: boolean) => void;
}) {
  const allVisibleSelected =
    candidates.length > 0 && candidates.every((c) => selected.includes(c.id));
  if (candidates.length === 0 && !search) {
    return (
      <EmptyState
        title="No candidates yet"
        description="Upload resumes to start screening candidates against this job."
        action={
          <Button size="sm" onClick={onOpenUpload}>
            Upload Resumes
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search candidates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <select
            className="h-9 rounded-lg border border-border bg-white px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All status</option>
            <option value="ai_screened">AI Screened</option>
            <option value="reviewed">Reviewed</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview">Interview</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            className="h-9 rounded-lg border border-border bg-white px-3 text-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="match">Sort: AI Match</option>
            <option value="newest">Sort: Newest</option>
            <option value="experience">Sort: Experience</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={onCompare} disabled={selected.length < 2}>
            Compare ({selected.length})
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={selected.length === 0}
            onClick={onDeleteSelected}
          >
            <Trash2 size={14} /> Delete ({selected.length})
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2.5 w-8">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    aria-label="Select all visible candidates"
                  />
                </th>
                <th className="px-3 py-2.5 font-medium">Rank</th>
                <th className="px-3 py-2.5 font-medium">Candidate</th>
                <th className="px-3 py-2.5 font-medium">Match</th>
                <th className="px-3 py-2.5 font-medium">Top Skills</th>
                <th className="px-3 py-2.5 font-medium">Experience</th>
                <th className="px-3 py-2.5 font-medium">Education</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, idx) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-slate-50/80">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      aria-label={`Select ${c.candidate_name}`}
                    />
                  </td>
                  <td className="px-3 py-3 tabular-nums text-slate-500">#{c.rank || idx + 1}</td>
                  <td className="px-3 py-3">
                    <Link
                      to={`/jobs/${jobId}/candidates/${c.id}`}
                      className="font-medium text-slate-900 hover:text-brand-700"
                    >
                      {c.candidate_name}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.integrity_check?.risk_level === "high" && (
                        <Badge tone="warning">Integrity risk</Badge>
                      )}
                      {c.duplicate_warning?.is_duplicate && (
                        <Badge tone="warning">Duplicate</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <MatchScore score={c.final_score} size="sm" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex max-w-[220px] flex-wrap gap-1">
                      {c.matched_skills.slice(0, 3).map((s) => (
                        <SkillBadge key={s} skill={s} tone="success" />
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {c.experienceYears ? `${c.experienceYears} yrs` : "—"}
                  </td>
                  <td className="max-w-[180px] truncate px-3 py-3 text-slate-600">
                    {c.education[0] ?? "—"}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/jobs/${jobId}/candidates/${c.id}`}
                        className="text-xs font-medium text-brand-600"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        className="text-xs font-medium text-slate-600 hover:text-brand-700"
                        onClick={() => downloadCandidateReport(c, job)}
                      >
                        Report
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CandidateTable({
  candidates,
  job,
  jobId,
  empty,
  onDelete,
}: {
  candidates: Candidate[];
  job: Job;
  jobId: string;
  empty: string;
  onDelete?: (id: string) => void;
}) {
  if (candidates.length === 0) {
    return <p className="text-sm text-slate-500">{empty}</p>;
  }
  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-slate-50 text-xs text-slate-500">
          <tr>
            <th className="px-4 py-2.5 font-medium">Candidate</th>
            <th className="px-4 py-2.5 font-medium">Match</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => (
            <tr key={c.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium">{c.candidate_name}</td>
              <td className="px-4 py-3 tabular-nums">{Math.round(c.final_score)}%</td>
              <td className="px-4 py-3">
                <StatusBadge status={c.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Link to={`/jobs/${jobId}/candidates/${c.id}`} className="text-xs text-brand-600">
                    View
                  </Link>
                  <button
                    type="button"
                    className="text-xs text-slate-600 hover:text-brand-700"
                    onClick={() => downloadCandidateReport(c, job)}
                  >
                    Report
                  </button>
                  {onDelete && (
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:text-red-700"
                      onClick={() => onDelete(c.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
