import { PageHeader, PageBody } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/MetricCard";
import { useWorkspace } from "@/store/WorkspaceContext";
import { Link } from "react-router-dom";

export function InterviewsPage() {
  const { interviews, candidates, jobs, addToast } = useWorkspace();
  const upcoming = interviews.filter((i) => i.status === "scheduled");

  return (
    <>
      <PageHeader title="Interviews" subtitle={`${upcoming.length} upcoming`} />
      <PageBody>
        {upcoming.length === 0 ? (
          <EmptyState
            title="No upcoming interviews"
            description="Move a shortlisted candidate to interview from their profile."
            action={
              <Link to="/shortlisted">
                <Button size="sm">View Shortlisted</Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-[10px] border border-border bg-white shadow-sm">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-border bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Candidate</th>
                  <th className="px-4 py-2.5 font-medium">Job</th>
                  <th className="px-4 py-2.5 font-medium">Interview Date</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">Interviewer</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((i) => {
                  const c = candidates.find((x) => x.id === i.candidateId);
                  const j = jobs.find((x) => x.id === i.jobId);
                  return (
                    <tr key={i.id} className="border-b border-border last:border-0 hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium">{c?.candidate_name ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{j?.title}</td>
                      <td className="px-4 py-3">{new Date(i.date).toLocaleString()}</td>
                      <td className="px-4 py-3">{i.type}</td>
                      <td className="px-4 py-3">{i.interviewer}</td>
                      <td className="px-4 py-3">
                        <Badge tone="brand">{i.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 text-xs">
                          {c && (
                            <Link to={`/jobs/${i.jobId}/candidates/${c.id}`} className="text-brand-600">
                              View
                            </Link>
                          )}
                          <button
                            className="text-slate-600"
                            onClick={() => addToast({ title: "Reschedule requested", type: "info" })}
                          >
                            Reschedule
                          </button>
                          <button
                            className="text-red-600"
                            onClick={() => addToast({ title: "Interview cancelled", type: "info" })}
                          >
                            Cancel
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
