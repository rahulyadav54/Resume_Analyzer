import { Link } from "react-router-dom";
import { Play, Plus, Upload } from "lucide-react";
import { PageHeader, PageBody } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { MetricCard, EmptyState } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { useWorkspace } from "@/store/WorkspaceContext";
import { formatRelativeDate } from "@/lib/utils";

export function DashboardPage() {
  const { jobs, candidates, interviews, dbEnabled, dbLoading, demoMode, loadDemoSeed, exitDemoSession } =
    useWorkspace();

  const activeJobs = jobs.filter((j) => j.status === "active");
  const shortlisted = candidates.filter((c) =>
    ["shortlisted", "interview", "selected"].includes(c.status)
  ).length;
  const screened = candidates.filter((c) => c.status !== "applied").length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Recruitment pipeline across all open roles"
      />
      <PageBody>
        {demoMode && (
          <div className="mb-4 flex flex-col gap-2 rounded-[10px] border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900 sm:flex-row sm:items-center sm:justify-between">
            <span>
              <strong>Demo session active</strong> — exploring sample jobs, candidates, and interviews.
            </span>
            <Button variant="secondary" size="sm" onClick={() => exitDemoSession()}>
              Exit demo
            </Button>
          </div>
        )}

        {!demoMode && !dbEnabled && !dbLoading && (
          <div className="mb-4 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Database not connected. Add <code className="text-xs">SUPABASE_URL</code> and{" "}
            <code className="text-xs">SUPABASE_SERVICE_KEY</code> to your backend to persist jobs
            and candidates.
          </div>
        )}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[28px] font-semibold tracking-tight text-slate-900">
              {greeting}, Rahul
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Here&apos;s what&apos;s happening across your recruitment pipeline.
              {dbEnabled && (
                <span className="ml-2 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Supabase connected
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={loadDemoSeed}>
              <Play size={14} /> Load Demo Data
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
          <MetricCard label="Active Jobs" value={activeJobs.length} />
          <MetricCard label="Total Candidates" value={candidates.length} />
          <MetricCard label="AI Screened" value={screened} hint="Across all jobs" />
          <MetricCard label="Shortlisted" value={shortlisted} />
          <MetricCard
            label="Interviews"
            value={interviews.filter((i) => i.status === "scheduled").length}
          />
        </div>

        {dbLoading ? (
          <p className="text-sm text-slate-500">Loading workspace…</p>
        ) : activeJobs.length === 0 ? (
          <EmptyState
            title="No active jobs"
            description="Start a demo session or create your first job to begin AI screening."
            action={
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={loadDemoSeed}>
                  Load Demo Data
                </Button>
                <Link to="/jobs/new">
                  <Button size="sm">Create Job</Button>
                </Link>
              </div>
            }
          />
        ) : (
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
        )}
      </PageBody>
    </>
  );
}
