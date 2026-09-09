import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { PageHeader, PageBody } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge, SkillBadge } from "@/components/candidates/StatusBadge";
import { MatchScore } from "@/components/candidates/MatchScore";
import { downloadCandidateReport } from "@/lib/candidateReport";
import { useWorkspace } from "@/store/WorkspaceContext";

export function CandidatesPage() {
  const { candidates, jobs, deleteCandidates, addToast } = useWorkspace();
  const [q, setQ] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return candidates
      .filter((c) => {
        if (c.final_score < minScore) return false;
        if (!q) return true;
        const s = q.toLowerCase();
        return (
          c.candidate_name.toLowerCase().includes(s) ||
          c.extracted_skills.some((x) => x.includes(s)) ||
          c.status.includes(s) ||
          jobs.find((j) => j.id === c.jobId)?.title.toLowerCase().includes(s)
        );
      })
      .sort((a, b) => b.final_score - a.final_score);
  }, [candidates, q, minScore, jobs]);

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((c) => selected.includes(c.id));

  const toggleSelect = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const toggleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelected((s) => s.filter((id) => !filtered.some((c) => c.id === id)));
      return;
    }
    setSelected((s) => [...new Set([...s, ...filtered.map((c) => c.id)])]);
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) {
      addToast({ title: "No candidates selected", type: "info" });
      return;
    }
    if (
      !window.confirm(
        `Delete ${selected.length} candidate${selected.length === 1 ? "" : "s"}? This cannot be undone.`
      )
    ) {
      return;
    }
    const idsToDelete = [...selected];
    await deleteCandidates(idsToDelete);
    setSelected((s) => s.filter((id) => !idsToDelete.includes(id)));
  };

  return (
    <>
      <PageHeader
        title="Candidates"
        subtitle={`${filtered.length} applicants · AI screening completed`}
      />
      <PageBody>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search name, skill, job, status…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-sm"
          />
          <select
            className="h-9 rounded-lg border border-border bg-white px-3 text-sm"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
          >
            <option value={0}>Match: All</option>
            <option value={90}>90–100</option>
            <option value={75}>75+</option>
            <option value={60}>60+</option>
          </select>
          {q && (
            <button
              className="rounded-md border border-border bg-white px-2 py-1 text-xs text-slate-600"
              onClick={() => setQ("")}
            >
              Clear search ×
            </button>
          )}
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-border bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 w-8">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      aria-label="Select all visible candidates"
                    />
                  </th>
                  <th className="px-4 py-2.5 font-medium">Candidate</th>
                  <th className="px-4 py-2.5 font-medium">Job</th>
                  <th className="px-4 py-2.5 font-medium">Match</th>
                  <th className="px-4 py-2.5 font-medium">Top Skills</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const job = jobs.find((j) => j.id === c.jobId);
                  return (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          aria-label={`Select ${c.candidate_name}`}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{c.candidate_name}</td>
                      <td className="px-4 py-3 text-slate-600">{job?.title ?? "—"}</td>
                      <td className="px-4 py-3">
                        <MatchScore score={c.final_score} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {c.matched_skills.slice(0, 3).map((s) => (
                            <SkillBadge key={s} skill={s} tone="success" />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/jobs/${c.jobId}/candidates/${c.id}`}
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
                          <button
                            type="button"
                            className="text-xs font-medium text-red-600 hover:text-red-700"
                            onClick={async () => {
                              if (!window.confirm(`Delete ${c.candidate_name}?`)) return;
                              await deleteCandidates([c.id]);
                              setSelected((s) => s.filter((id) => id !== c.id));
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
        </div>
      </PageBody>
    </>
  );
}
