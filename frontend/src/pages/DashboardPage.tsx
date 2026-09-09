import { Link } from "react-router-dom";
import { Plus, Upload } from "lucide-react";
import { PageHeader, PageBody } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { useWorkspace } from "@/store/WorkspaceContext";
import { formatRelativeDate } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { runDemoScreening } from "@/lib/api";

export function DashboardPage() {
  const {
    jobs,
    candidates,
    interviews,
    ingestScreeningResults,
    loadDemoSeed,
    addToast,
  } = useWorkspace();

  const activeJobs = jobs.filter((j) => j.status === "active");
  const shortlisted = candidates.filter((c) =>
    ["shortlisted", "interview", "selected"].includes(c.status)
  ).length;
  const screened = candidates.filter((c) => c.status !== "applied").length;

  const demoMutation = useMutation({
    mutationFn: runDemoScreening,
    onSuccess: (data) => {
      loadDemoSeed();
      ingestScreeningResults("job_python", data.results);
      addToast({
        title: "Demo screening complete",
        description: `${data.total_candidates} sample resumes ranked for Python Backend`,
        type: "success",
      });
    },
    onError: () => {
      loadDemoSeed();
      addToast({
        title: "Loaded local demo data",
        description: "Backend unreachable — using seeded workspace data",
        type: "info",
      });
    },
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Recruitment pipeline across all open roles"
      />
      <PageBody>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[28px] font-semibold tracking-tight text-slate-900">
              {greeting}, Rahul
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Here&apos;s what&apos;s happening across your recruitment pipeline.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={demoMutation.isPending}
              onClick={() => demoMutation.mutate()}
            >
              {demoMutation.isPending ? "Running demo…" : "Try Demo Data"}
            </Button>
            <Link to="/jobs">
              <Button variant="secondary" size="sm">
                <Upload size={14} /> Upload Resumes
              </Button>
            </Link>
            <Link to="/jobs/new">
              <Button size="sm">
                <Plus size={14} /> Create Job
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <MetricCard label="Active Jobs" value={activeJobs.length} trend="+2 this week" />
          <MetricCard label="Total Candidates" value={candidates.length} trend="+18.4% this month" />
          <MetricCard label="AI Screened" value={screened} hint="Across all jobs" />
          <MetricCard label="Shortlisted" value={shortlisted} />
          <MetricCard
            label="Interviews"
            value={interviews.filter((i) => i.status === "scheduled").length}
          />
        </div>

        <div className="overflow-hidden rounded-[10px] border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Active Jobs</h3>
            <Link to="/jobs" className="text-xs font-medium text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Job</th>
                  <th className="px-4 py-2.5 font-medium">Department</th>
                  <th className="px-4 py-2.5 font-medium">Candidates</th>
                  <th className="px-4 py-2.5 font-medium">Screened</th>
                  <th className="px-4 py-2.5 font-medium">Shortlisted</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Created</th>
                  <th className="px-4 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeJobs.map((job) => {
                  const jc = candidates.filter((c) => c.jobId === job.id);
                  const screenedCount = jc.filter((c) => c.status !== "applied").length;
                  const shortCount = jc.filter((c) =>
                    ["shortlisted", "interview", "selected"].includes(c.status)
                  ).length;
                  return (
                    <tr key={job.id} className="border-b border-border last:border-0 hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-900">{job.title}</td>
                      <td className="px-4 py-3 text-slate-600">{job.department}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">{jc.length}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">{screenedCount}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">{shortCount}</td>
                      <td className="px-4 py-3">
                        <Badge tone="success">Active</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatRelativeDate(job.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link to={`/jobs/${job.id}`} className="text-xs font-medium text-brand-600 hover:underline">
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </PageBody>
    </>
  );
}
