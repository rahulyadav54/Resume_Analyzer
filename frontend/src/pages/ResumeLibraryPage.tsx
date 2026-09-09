import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, PageBody } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useWorkspace } from "@/store/WorkspaceContext";
import { formatRelativeDate } from "@/lib/utils";

export function ResumeLibraryPage() {
  const { resumes, jobs, addToast } = useWorkspace();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return resumes.filter((r) => {
      if (!q) return true;
      const s = q.toLowerCase();
      return (
        r.candidateName.toLowerCase().includes(s) ||
        r.fileName.toLowerCase().includes(s) ||
        jobs.find((j) => j.id === r.jobId)?.title.toLowerCase().includes(s)
      );
    });
  }, [resumes, q, jobs]);

  return (
    <>
      <PageHeader title="Resume Library" subtitle="Search all uploaded resumes" />
      <PageBody>
        <Input
          placeholder="Search resumes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mb-4 max-w-sm"
        />
        <div className="overflow-hidden rounded-[10px] border border-border bg-white shadow-sm">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Candidate</th>
                <th className="px-4 py-2.5 font-medium">File</th>
                <th className="px-4 py-2.5 font-medium">Job</th>
                <th className="px-4 py-2.5 font-medium">Uploaded</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Match</th>
                <th className="px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const job = jobs.find((j) => j.id === r.jobId);
                return (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium">{r.candidateName}</td>
                    <td className="px-4 py-3 text-slate-600">{r.fileName}</td>
                    <td className="px-4 py-3 text-slate-600">{job?.title ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{formatRelativeDate(r.uploadedAt)}</td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          r.status === "analyzed"
                            ? "success"
                            : r.status === "failed"
                              ? "danger"
                              : "info"
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {r.match != null ? `${Math.round(r.match)}%` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 text-xs">
                        {r.candidateId ? (
                          <Link
                            to={`/jobs/${r.jobId}/candidates/${r.candidateId}`}
                            className="text-brand-600"
                          >
                            View
                          </Link>
                        ) : (
                          <span className="text-slate-400">View</span>
                        )}
                        <button
                          className="text-slate-600"
                          onClick={() => addToast({ title: "Download started", type: "info" })}
                        >
                          Download
                        </button>
                        <button
                          className="text-red-600"
                          onClick={() => addToast({ title: "Delete queued", type: "info" })}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </PageBody>
    </>
  );
}
