import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { PageHeader, PageBody } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useWorkspace } from "@/store/WorkspaceContext";
import { formatRelativeDate } from "@/lib/utils";

export function ResumeLibraryPage() {
  const { resumes, jobs, deleteResumes, addToast } = useWorkspace();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

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

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((r) => selected.includes(r.id));

  const toggleSelect = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const toggleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelected((s) => s.filter((id) => !filtered.some((r) => r.id === id)));
      return;
    }
    setSelected((s) => [...new Set([...s, ...filtered.map((r) => r.id)])]);
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) {
      addToast({ title: "No resumes selected", type: "info" });
      return;
    }
    if (
      !window.confirm(
        `Delete ${selected.length} resume${selected.length === 1 ? "" : "s"} and linked candidate records?`
      )
    ) {
      return;
    }
    await deleteResumes(selected);
    setSelected([]);
  };

  return (
    <>
      <PageHeader title="Resume Library" subtitle="Search all uploaded resumes" />
      <PageBody>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search resumes…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-sm"
          />
          <Button
            variant="danger"
            size="sm"
            disabled={selected.length === 0}
            onClick={handleDeleteSelected}
          >
            <Trash2 size={14} /> Delete ({selected.length})
          </Button>
        </div>
        <div className="overflow-hidden rounded-[10px] border border-border bg-white shadow-sm">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2.5 w-8">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    aria-label="Select all visible resumes"
                  />
                </th>
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
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        aria-label={`Select ${r.candidateName}`}
                      />
                    </td>
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
                          type="button"
                          className="text-red-600 hover:text-red-700"
                          onClick={async () => {
                            if (!window.confirm(`Delete resume for ${r.candidateName}?`)) return;
                            await deleteResumes([r.id]);
                            setSelected((s) => s.filter((id) => id !== r.id));
                          }}
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
