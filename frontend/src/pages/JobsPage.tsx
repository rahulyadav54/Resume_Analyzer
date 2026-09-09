import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { PageHeader, PageBody } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/MetricCard";
import { useWorkspace } from "@/store/WorkspaceContext";
import { formatRelativeDate } from "@/lib/utils";

export function JobsPage() {
  const { jobs, candidates } = useWorkspace();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [dept, setDept] = useState("all");

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (status !== "all" && j.status !== status) return false;
      if (dept !== "all" && j.department !== dept) return false;
      if (q && !j.title.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [jobs, q, status, dept]);

  const departments = [...new Set(jobs.map((j) => j.department))];

  return (
    <>
      <PageHeader title="Jobs" subtitle="Manage open positions and recruitment pipelines" />
      <PageBody>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap gap-2">
            <Input
              placeholder="Search jobs…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-xs"
            />
            <select
              className="h-9 rounded-lg border border-border bg-white px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
            <select
              className="h-9 rounded-lg border border-border bg-white px-3 text-sm"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
            >
              <option value="all">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <Link to="/jobs/new">
            <Button size="sm">
              <Plus size={14} /> Create Job
            </Button>
          </Link>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No active jobs"
            description="Create your first job to start recruiting."
            action={
              <Link to="/jobs/new">
                <Button size="sm">Create Job</Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-[10px] border border-border bg-white shadow-sm">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-border bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Job</th>
                  <th className="px-4 py-2.5 font-medium">Department</th>
                  <th className="px-4 py-2.5 font-medium">Location</th>
                  <th className="px-4 py-2.5 font-medium">Candidates</th>
                  <th className="px-4 py-2.5 font-medium">Shortlisted</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Created</th>
                  <th className="px-4 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((job) => {
                  const jc = candidates.filter((c) => c.jobId === job.id);
                  const shortCount = jc.filter((c) =>
                    ["shortlisted", "interview", "selected"].includes(c.status)
                  ).length;
                  return (
                    <tr key={job.id} className="border-b border-border last:border-0 hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <Link to={`/jobs/${job.id}`} className="font-medium text-slate-900 hover:text-brand-700">
                          {job.title}
                        </Link>
                        <p className="text-xs text-slate-500">{job.employmentType}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{job.department}</td>
                      <td className="px-4 py-3 text-slate-600">{job.location}</td>
                      <td className="px-4 py-3 tabular-nums">{jc.length}</td>
                      <td className="px-4 py-3 tabular-nums">{shortCount}</td>
                      <td className="px-4 py-3">
                        <Badge
                          tone={
                            job.status === "active"
                              ? "success"
                              : job.status === "paused"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {job.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatRelativeDate(job.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link to={`/jobs/${job.id}`} className="text-xs font-medium text-brand-600">
                          View
                        </Link>
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
