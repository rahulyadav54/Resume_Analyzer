import { Link, useParams, useSearchParams } from "react-router-dom";
import { PageHeader, PageBody } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { useWorkspace } from "@/store/WorkspaceContext";
import { cn } from "@/lib/utils";

export function ComparePage() {
  const { jobId } = useParams();
  const [params] = useSearchParams();
  const ids = (params.get("ids") ?? "").split(",").filter(Boolean);
  const { candidates } = useWorkspace();
  const selected = candidates.filter((c) => ids.includes(c.id));

  const rows: { label: string; get: (c: (typeof selected)[0]) => string | number; higherBetter?: boolean }[] = [
    { label: "Overall Match", get: (c) => c.final_score, higherBetter: true },
    { label: "Required Skills", get: (c) => c.skill_score, higherBetter: true },
    { label: "Experience (yrs)", get: (c) => c.experienceYears ?? 0, higherBetter: true },
    { label: "Projects", get: (c) => c.projects.length, higherBetter: true },
    { label: "Education", get: (c) => c.education[0] ?? "—" },
    { label: "Certifications", get: (c) => c.certifications.length, higherBetter: true },
    { label: "Preferred / Matched", get: (c) => c.matched_skills.length, higherBetter: true },
    { label: "Skill Gaps", get: (c) => c.missing_skills.length, higherBetter: false },
  ];

  const bestIdx = (values: (string | number)[], higherBetter = true) => {
    const nums = values.map((v) => (typeof v === "number" ? v : -1));
    if (nums.every((n) => n < 0)) return -1;
    return higherBetter
      ? nums.indexOf(Math.max(...nums))
      : nums.indexOf(Math.min(...nums));
  };

  return (
    <>
      <PageHeader title="Compare Candidates" subtitle={`${selected.length} selected`} />
      <PageBody>
        <div className="mb-3">
          <Link to={`/jobs/${jobId}`}>
            <Button size="sm" variant="secondary">
              Back to job
            </Button>
          </Link>
        </div>
        {selected.length < 2 ? (
          <p className="text-sm text-slate-500">Select at least two candidates to compare.</p>
        ) : (
          <div className="overflow-x-auto rounded-[10px] border border-border bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Metric</th>
                  {selected.map((c) => (
                    <th key={c.id} className="px-4 py-2.5 font-medium text-slate-900">
                      {c.candidate_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const values = selected.map((c) => row.get(c));
                  const best =
                    row.higherBetter === undefined ? -1 : bestIdx(values, row.higherBetter);
                  return (
                    <tr key={row.label} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-slate-600">{row.label}</td>
                      {values.map((v, i) => (
                        <td
                          key={i}
                          className={cn(
                            "px-4 py-3",
                            i === best && "bg-emerald-50 font-semibold text-emerald-800"
                          )}
                        >
                          {typeof v === "number" && row.label.includes("Match")
                            ? `${Math.round(v)}%`
                            : Array.isArray(v)
                              ? v
                              : String(v)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                <tr>
                  <td className="px-4 py-3 text-slate-600">Skill Gaps</td>
                  {selected.map((c) => (
                    <td key={c.id} className="px-4 py-3 text-xs text-slate-600">
                      {c.missing_skills.join(", ") || "None"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </PageBody>
    </>
  );
}
