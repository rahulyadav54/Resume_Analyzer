import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  Download,
  MoreHorizontal,
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
import { downloadResultsCsv, runDemoScreening, screenResumes } from "@/lib/api";
import { uid } from "@/lib/utils";
import type { Candidate } from "@/types";

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
  } = useWorkspace();
  const job = jobs.find((j) => j.id === jobId);
  const [tab, setTab] = useState<Tab>("Candidates");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("match");
  const [selected, setSelected] = useState<string[]>([]);
  const [processing, setProcessing] = useState<string[]>([]);
  const [showUpload, setShowUpload] = useState(false);

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
      return screenResumes({
        jobDescription: job!.description,
        requiredSkills: job!.requiredSkills.join(", "),
        files,
        jobId: jobId!,
      });
    },
    onSuccess: async (data, files) => {
      await ingestScreeningResults(
        jobId!,
        data.results,
        files.map((f) => f.name)
      );
      setProcessing([]);
      setShowUpload(false);
      setTab("Candidates");
    },
    onError: () => {
      setProcessing([]);
      addToast({
        title: "Resume processing failed",
        description: "Ensure the FastAPI backend is running on port 8000.",
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
      }),
    onSuccess: async (data) => {
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

  return (
    <>
      <PageHeader
        title={job.title}
        subtitle={`${job.department} · ${job.employmentType} · ${jobCandidates.length} applicants`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={job.status === "active" ? "success" : "warning"}>{job.status.toUpperCase()}</Badge>
            <Button variant="secondary" size="sm" onClick={() => setShowUpload((v) => !v)}>
              <UploadIcon size={14} /> Upload Resumes
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

        {showUpload && (
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Upload Candidates</h3>
                  <p className="text-xs text-slate-500">
                    Upload resumes (PDF/DOCX) or run live AI screening on bundled sample resumes.
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
                onFiles={(files) => screenMutation.mutate(files)}
              />
              {processing.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs font-medium text-slate-600">
                    Uploading → Extracting text → Analyzing skills → Matching → Ranking…
                  </p>
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
          </div>
        )}

        {tab === "Candidates" && (
          <CandidatesTab
            candidates={jobCandidates}
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
          />
        )}

        {tab === "Shortlisted" && (
          <CandidateTable candidates={shortlisted} jobId={job.id} empty="No shortlisted candidates yet." />
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
}: {
  candidates: Candidate[];
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
}) {
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
        <Button variant="secondary" size="sm" onClick={onCompare} disabled={selected.length < 2}>
          Compare ({selected.length})
        </Button>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2.5 w-8" />
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
                    <Link
                      to={`/jobs/${jobId}/candidates/${c.id}`}
                      className="text-xs font-medium text-brand-600"
                    >
                      View
                    </Link>
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
  jobId,
  empty,
}: {
  candidates: Candidate[];
  jobId: string;
  empty: string;
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
                <Link to={`/jobs/${jobId}/candidates/${c.id}`} className="text-xs text-brand-600">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
