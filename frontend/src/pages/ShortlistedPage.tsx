import { Link } from "react-router-dom";
import { PageHeader, PageBody } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/candidates/StatusBadge";
import { EmptyState } from "@/components/ui/MetricCard";
import { useWorkspace } from "@/store/WorkspaceContext";

export function ShortlistedPage() {
  const { candidates, jobs, scheduleInterview, updateCandidateStatus } = useWorkspace();
  const list = candidates.filter((c) =>
    ["shortlisted", "interview", "selected"].includes(c.status)
  );

  return (
    <>
      <PageHeader title="Shortlisted" subtitle={`${list.length} candidates in hiring pipeline`} />
      <PageBody>
        {list.length === 0 ? (
          <EmptyState
            title="No shortlisted candidates"
            description="Shortlist candidates from a job workspace to see them here."
            action={
              <Link to="/jobs">
                <Button size="sm">Go to Jobs</Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-[10px] border border-border bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Candidate</th>
                  <th className="px-4 py-2.5 font-medium">Job</th>
                  <th className="px-4 py-2.5 font-medium">Match</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const job = jobs.find((j) => j.id === c.jobId);
                  return (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium">{c.candidate_name}</td>
                      <td className="px-4 py-3 text-slate-600">{job?.title}</td>
                      <td className="px-4 py-3 tabular-nums">{Math.round(c.final_score)}%</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link to={`/jobs/${c.jobId}/candidates/${c.id}`} className="text-xs text-brand-600">
                            View
                          </Link>
                          {c.status === "shortlisted" && (
                            <button
                              className="text-xs text-slate-600 hover:text-brand-700"
                              onClick={() => scheduleInterview(c.id, c.jobId)}
                            >
                              Interview
                            </button>
                          )}
                          <button
                            className="text-xs text-red-600"
                            onClick={() => updateCandidateStatus(c.id, "rejected")}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageBody>
    </>
  );
}
