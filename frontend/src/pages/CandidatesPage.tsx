import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, PageBody } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";
import { StatusBadge, SkillBadge } from "@/components/candidates/StatusBadge";
import { MatchScore } from "@/components/candidates/MatchScore";
import { useWorkspace } from "@/store/WorkspaceContext";

export function CandidatesPage() {
  const { candidates, jobs } = useWorkspace();
  const [q, setQ] = useState("");
  const [minScore, setMinScore] = useState(0);

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

  return (
    <>
      <PageHeader
        title="Candidates"
        subtitle={`${filtered.length} applicants · AI screening completed`}
      />
      <PageBody>
        <div className="mb-4 flex flex-wrap gap-2">
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
        </div>

        <div className="overflow-hidden rounded-[10px] border border-border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-border bg-slate-50 text-xs text-slate-500">
                <tr>
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
                        <Link
                          to={`/jobs/${c.jobId}/candidates/${c.id}`}
                          className="text-xs font-medium text-brand-600"
                        >
                          View
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
