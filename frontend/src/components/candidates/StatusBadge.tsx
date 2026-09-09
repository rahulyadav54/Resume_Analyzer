import { Badge } from "@/components/ui/Badge";
import type { CandidateStatus } from "@/types";

const map: Record<
  CandidateStatus,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" | "brand" | "info" }
> = {
  applied: { label: "Applied", tone: "neutral" },
  ai_screened: { label: "AI Screened", tone: "info" },
  reviewed: { label: "Reviewed", tone: "warning" },
  shortlisted: { label: "Shortlisted", tone: "success" },
  interview: { label: "Interview", tone: "brand" },
  selected: { label: "Selected", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

export function StatusBadge({ status }: { status: CandidateStatus }) {
  const m = map[status];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

export function SkillBadge({ skill, tone = "neutral" }: { skill: string; tone?: "success" | "danger" | "neutral" | "brand" }) {
  return <Badge tone={tone === "success" ? "success" : tone === "danger" ? "danger" : tone === "brand" ? "brand" : "neutral"}>{skill}</Badge>;
}

export function AIInsight({
  summary,
  strengths,
  concerns,
  evidence,
}: {
  summary: string;
  strengths: string[];
  concerns: string[];
  evidence?: { skill: string; note: string }[];
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI Insights</p>
        <p className="mt-1 text-sm text-slate-700">{summary}</p>
        <p className="mt-2 text-[11px] text-slate-400">
          Decision support only — recruiter makes the final call.
        </p>
      </div>

      {evidence && evidence.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-slate-700">Evidence</p>
          <ul className="space-y-1.5">
            {evidence.map((e) => (
              <li key={e.skill} className="flex items-start justify-between gap-2 text-sm">
                <span className="font-medium text-slate-800">{e.skill}</span>
                <span className="text-right text-xs text-slate-500">{e.note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {strengths.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold text-emerald-700">Why this candidate</p>
          <ul className="space-y-1">
            {strengths.map((s) => (
              <li key={s} className="text-sm text-slate-600">
                + {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {concerns.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold text-amber-700">Potential gaps</p>
          <ul className="space-y-1">
            {concerns.map((c) => (
              <li key={c} className="text-sm text-slate-600">
                − {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
