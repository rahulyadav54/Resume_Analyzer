import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { Download, Trophy } from "lucide-react";
import { PageHeader, PageBody } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useWorkspace } from "@/store/WorkspaceContext";
import { cn } from "@/lib/utils";

export function ComparePage() {
  const { jobId } = useParams();
  const [params] = useSearchParams();
  const ids = (params.get("ids") ?? "").split(",").filter(Boolean);
  const { candidates, logAudit } = useWorkspace();
  const selected = candidates.filter((c) => ids.includes(c.id));

  const rows: {
    label: string;
    get: (c: (typeof selected)[0]) => string | number;
    higherBetter?: boolean;
  }[] = [
    { label: "Overall Match", get: (c) => c.final_score, higherBetter: true },
    { label: "Required Skills", get: (c) => c.skill_score, higherBetter: true },
    { label: "JD Similarity", get: (c) => c.similarity_score, higherBetter: true },
    { label: "Profile Strength", get: (c) => c.profile_score, higherBetter: true },
    { label: "Integrity Score", get: (c) => c.integrity_check?.integrity_score ?? 0, higherBetter: true },
    { label: "Experience (yrs)", get: (c) => c.experienceYears ?? 0, higherBetter: true },
    { label: "Projects", get: (c) => c.projects.length, higherBetter: true },
    { label: "Certifications", get: (c) => c.certifications.length, higherBetter: true },
    { label: "Matched Skills", get: (c) => c.matched_skills.length, higherBetter: true },
    { label: "Skill Gaps", get: (c) => c.missing_skills.length, higherBetter: false },
  ];

  const bestIdx = (values: (string | number)[], higherBetter = true) => {
    const nums = values.map((v) => (typeof v === "number" ? v : -1));
    if (nums.every((n) => n < 0)) return -1;
    return higherBetter
      ? nums.indexOf(Math.max(...nums))
      : nums.indexOf(Math.min(...nums));
  };

  const winner =
    selected.length >= 2
      ? [...selected].sort((a, b) => b.final_score - a.final_score)[0]
      : null;

  const radarData = [
    { metric: "Match", fullMark: 100 },
    { metric: "Skills", fullMark: 100 },
    { metric: "Similarity", fullMark: 100 },
    { metric: "Profile", fullMark: 100 },
    { metric: "Integrity", fullMark: 100 },
  ].map((row) => {
    const point: Record<string, string | number> = { metric: row.metric };
    selected.forEach((c) => {
      point[c.candidate_name] =
        row.metric === "Match"
          ? c.final_score
          : row.metric === "Skills"
            ? c.skill_score
            : row.metric === "Similarity"
              ? c.similarity_score
              : row.metric === "Profile"
                ? c.profile_score
                : c.integrity_check?.integrity_score ?? 0;
    });
    return point;
  });

  const exportComparison = async () => {
    const header = ["Metric", ...selected.map((c) => c.candidate_name)].join(",");
    const body = rows
      .map((row) => [row.label, ...selected.map((c) => row.get(c))].join(","))
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "candidate-comparison.csv";
    link.click();
    URL.revokeObjectURL(url);
    await logAudit(
      "comparison_exported",
      selected.map((c) => c.candidate_name).join(" vs "),
      "Exported side-by-side comparison report"
    );
  };

  const chartColors = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b"];

  return (
    <>
      <PageHeader title="Compare Candidates" subtitle={`${selected.length} selected for evaluation`} />
      <PageBody>
        <div className="mb-4 flex flex-wrap gap-2">
          <Link to={`/jobs/${jobId}`}>
            <Button size="sm" variant="secondary">Back to job</Button>
          </Link>
          {selected.length >= 2 && (
            <Button size="sm" variant="secondary" onClick={exportComparison}>
              <Download className="h-4 w-4" />
              Export comparison
            </Button>
          )}
        </div>

        {selected.length < 2 ? (
          <p className="text-sm text-slate-500">Select at least two candidates to compare.</p>
        ) : (
          <div className="space-y-4">
            {winner && (
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardBody className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">Recommended finalist</p>
                      <p className="text-lg font-semibold text-slate-900">{winner.candidate_name}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="success">{Math.round(winner.final_score)}% overall</Badge>
                    <Badge tone="neutral">{winner.decision}</Badge>
                    {winner.integrity_check && (
                      <Badge tone={winner.integrity_check.risk_level === "low" ? "success" : "warning"}>
                        Integrity {winner.integrity_check.integrity_score}%
                      </Badge>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-semibold text-slate-900">Visual comparison</h3>
                </CardHeader>
                <CardBody className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      {selected.map((c, i) => (
                        <Radar
                          key={c.id}
                          name={c.candidate_name}
                          dataKey={c.candidate_name}
                          stroke={chartColors[i % chartColors.length]}
                          fill={chartColors[i % chartColors.length]}
                          fillOpacity={0.15}
                        />
                      ))}
                    </RadarChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-sm font-semibold text-slate-900">Decision summary</h3>
                </CardHeader>
                <CardBody className="space-y-3">
                  {selected.map((c) => (
                    <div key={c.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-slate-900">{c.candidate_name}</p>
                        <Badge tone="brand">{Math.round(c.final_score)}%</Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{c.decision}</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {c.recommendation?.summary ?? c.explanation}
                      </p>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </div>

            <div className="overflow-x-auto rounded-[10px] border border-border bg-white shadow-sm">
              <table className="w-full min-w-[720px] text-left text-sm">
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
                            {typeof v === "number" &&
                            ["Overall Match", "Required Skills", "JD Similarity", "Profile Strength", "Integrity Score"].includes(
                              row.label
                            )
                              ? `${Math.round(v)}%`
                              : String(v)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  <tr>
                    <td className="px-4 py-3 text-slate-600">Missing skills</td>
                    {selected.map((c) => (
                      <td key={c.id} className="px-4 py-3 text-xs text-slate-600">
                        {c.missing_skills.join(", ") || "None"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </PageBody>
    </>
  );
}
