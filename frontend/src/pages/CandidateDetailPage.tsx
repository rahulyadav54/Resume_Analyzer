import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Download, Mail } from "lucide-react";
import { PageHeader, PageBody } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { MatchScore, MatchBreakdown } from "@/components/candidates/MatchScore";
import { AIInsight, SkillBadge, StatusBadge } from "@/components/candidates/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/MetricCard";
import { useWorkspace } from "@/store/WorkspaceContext";
import { downloadCandidateReport, downloadCandidateReportText } from "@/lib/candidateReport";
import { getMatchLabel } from "@/lib/scoring";
import { initials } from "@/lib/utils";

export function CandidateDetailPage() {
  const { jobId, candidateId } = useParams();
  const navigate = useNavigate();
  const {
    candidates,
    jobs,
    updateCandidateStatus,
    deleteCandidates,
    scheduleInterview,
    addToast,
  } = useWorkspace();
  const candidate = candidates.find((c) => c.id === candidateId);
  const job = jobs.find((j) => j.id === jobId || j.id === candidate?.jobId);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState("");

  const evidence = useMemo(() => {
    if (!candidate) return [];
    return [
      ...candidate.matched_skills.slice(0, 4).map((s) => ({
        skill: s,
        note: candidate.projects.length
          ? `Found in skills${candidate.projects.some((p) => p.toLowerCase().includes(s)) ? " + projects" : ""}`
          : "Found in resume skills",
      })),
      ...candidate.missing_skills.slice(0, 3).map((s) => ({
        skill: s,
        note: "Limited / not found",
      })),
    ];
  }, [candidate]);

  if (!candidate) {
    return (
      <>
        <PageHeader title="Candidate" />
        <PageBody>
          <EmptyState
            title="Candidate not found"
            description="This candidate may have been removed from the workspace."
            action={
              <Link to={jobId ? `/jobs/${jobId}` : "/candidates"}>
                <Button size="sm">Back</Button>
              </Link>
            }
          />
        </PageBody>
      </>
    );
  }

  const generateEmail = (kind: string) => {
    const body = `Hi ${candidate.candidate_name.split(" ")[0]},

Thank you for applying to the ${job?.title ?? "open"} role at our company.

${
  kind === "shortlist"
    ? "We were impressed by your background and would like to move you forward in our process."
    : kind === "interview"
      ? "We would like to invite you to a technical interview. Please share your availability for next week."
      : kind === "reject"
        ? "After careful review, we will not be moving forward at this time. We appreciate your interest and wish you the best."
        : "We have received your application and our team is reviewing it."
}

Best regards,
Ramiyaa
Talent Acquisition`;
    setEmailDraft(body);
    setEmailOpen(true);
  };

  return (
    <>
      <PageHeader
        title={candidate.candidate_name}
        subtitle={`${job?.title ?? "Candidate"} · ${getMatchLabel(candidate.final_score)}`}
      />
      <PageBody>
        <div className="mb-4 flex flex-col gap-4 rounded-[10px] border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {initials(candidate.candidate_name)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{candidate.candidate_name}</h2>
                <StatusBadge status={candidate.status} />
              </div>
              <p className="text-sm text-slate-500">
                {candidate.email ?? "—"} · {candidate.location ?? "—"} ·{" "}
                {candidate.experienceYears ? `${candidate.experienceYears} yrs` : "Experience n/a"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => updateCandidateStatus(candidate.id, "shortlisted")}
            >
              Shortlist
            </Button>
            <Button
              size="sm"
              onClick={() => scheduleInterview(candidate.id, candidate.jobId)}
            >
              Move to Interview
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => updateCandidateStatus(candidate.id, "rejected")}
            >
              Reject
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={async () => {
                if (!window.confirm(`Delete ${candidate.candidate_name}? This cannot be undone.`)) return;
                await deleteCandidates([candidate.id]);
                navigate(jobId ? `/jobs/${jobId}` : "/candidates");
              }}
            >
              Delete
            </Button>
            <Button size="sm" variant="secondary" onClick={() => generateEmail("interview")}>
              <Mail size={14} /> Email
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                downloadCandidateReport(candidate, job);
                addToast({ title: "Report downloaded", type: "success" });
              }}
            >
              <Download size={14} /> Download Report
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                downloadCandidateReportText(candidate, job);
                addToast({ title: "Text report downloaded", type: "success" });
              }}
            >
              TXT
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold">Professional Summary</h3>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-slate-700">{candidate.explanation}</p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold">Experience / Internships</h3>
              </CardHeader>
              <CardBody>
                {candidate.internships.length === 0 ? (
                  <p className="text-sm text-slate-500">None detected</p>
                ) : (
                  <ul className="space-y-2">
                    {candidate.internships.map((i) => (
                      <li key={i} className="border-l-2 border-brand-200 pl-3 text-sm text-slate-700">
                        {i}
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold">Education</h3>
              </CardHeader>
              <CardBody className="space-y-1">
                {candidate.education.map((e) => (
                  <p key={e} className="text-sm text-slate-700">
                    {e}
                  </p>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold">Skills</h3>
              </CardHeader>
              <CardBody>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {candidate.extracted_skills.map((s) => (
                    <SkillBadge
                      key={s}
                      skill={s}
                      tone={candidate.matched_skills.includes(s) ? "success" : "neutral"}
                    />
                  ))}
                </div>
                <p className="mb-1 text-xs font-semibold text-slate-500">Matched</p>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {candidate.matched_skills.map((s) => (
                    <SkillBadge key={s} skill={s} tone="success" />
                  ))}
                </div>
                <p className="mb-1 text-xs font-semibold text-slate-500">Gaps</p>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.missing_skills.length === 0 ? (
                    <span className="text-sm text-slate-500">None</span>
                  ) : (
                    candidate.missing_skills.map((s) => (
                      <SkillBadge key={s} skill={s} tone="danger" />
                    ))
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold">Certifications</h3>
              </CardHeader>
              <CardBody>
                {candidate.certifications.length === 0 ? (
                  <p className="text-sm text-slate-500">None detected</p>
                ) : (
                  <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700">
                    {candidate.certifications.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold">Projects</h3>
              </CardHeader>
              <CardBody>
                <ul className="space-y-2">
                  {candidate.projects.map((p) => (
                    <li key={p} className="rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm">
                      {p}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold">Recruitment Timeline</h3>
              </CardHeader>
              <CardBody>
                <ol className="space-y-2 text-sm text-slate-600">
                  <li>Applied / uploaded · {new Date(candidate.uploadedAt).toLocaleString()}</li>
                  <li>AI Screened · score {Math.round(candidate.final_score)}%</li>
                  <li>Current status · {candidate.status.replace("_", " ")}</li>
                </ol>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold">AI Evaluation</h3>
              </CardHeader>
              <CardBody className="space-y-5">
                <MatchScore score={candidate.final_score} size="lg" />
                <MatchBreakdown
                  skillScore={candidate.skill_score}
                  similarityScore={candidate.similarity_score}
                  profileScore={candidate.profile_score}
                />
                <AIInsight
                  summary={candidate.recommendation?.summary ?? candidate.explanation}
                  strengths={candidate.recommendation?.strengths ?? []}
                  concerns={candidate.recommendation?.concerns ?? []}
                  evidence={evidence}
                />
                <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
                  <p className="text-xs font-semibold uppercase text-brand-700">Recommendation</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {candidate.recommendation?.recommended_action ?? candidate.decision}
                  </p>
                  <Badge tone="brand" className="mt-2">
                    {candidate.recommendation?.priority ?? "Medium"} priority
                  </Badge>
                </div>
              </CardBody>
            </Card>

            {emailOpen && (
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-semibold">Review email before sending</h3>
                </CardHeader>
                <CardBody className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {["received", "shortlist", "interview", "reject"].map((k) => (
                      <Button key={k} size="sm" variant="secondary" onClick={() => generateEmail(k)}>
                        {k}
                      </Button>
                    ))}
                  </div>
                  <Textarea rows={10} value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        addToast({ title: "Email sent successfully", type: "success" });
                        setEmailOpen(false);
                      }}
                    >
                      Send Email
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEmailOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </PageBody>
    </>
  );
}
