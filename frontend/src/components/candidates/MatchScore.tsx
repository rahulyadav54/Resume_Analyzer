import { getMatchLabel, getMatchTone } from "@/lib/scoring";
import { cn } from "@/lib/utils";

export function MatchScore({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  const label = getMatchLabel(score);
  const radius = size === "lg" ? 36 : size === "sm" ? 18 : 26;
  const stroke = size === "lg" ? 5 : 4;
  const c = 2 * Math.PI * radius;
  const offset = c - (Math.min(score, 100) / 100) * c;
  const box = (radius + stroke) * 2;

  return (
    <div className="flex items-center gap-3">
      <svg width={box} height={box} className="-rotate-90">
        <circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={stroke}
        />
        <circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          fill="none"
          stroke="#4F46E5"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div>
        <p
          className={cn(
            "font-semibold tabular-nums text-slate-900",
            size === "lg" ? "text-3xl" : size === "sm" ? "text-sm" : "text-xl"
          )}
        >
          {Math.round(score)}
          <span className="text-sm font-medium text-slate-400">%</span>
        </p>
        <span className={cn("mt-0.5 inline-flex rounded-md border px-1.5 py-0.5 text-[11px] font-medium", getMatchTone(score))}>
          {label}
        </span>
      </div>
    </div>
  );
}

export function MatchBreakdown({
  skillScore,
  similarityScore,
  profileScore,
}: {
  skillScore: number;
  similarityScore: number;
  profileScore: number;
}) {
  const rows = [
    { label: "Required Skills", value: skillScore },
    { label: "JD Similarity / Experience", value: similarityScore },
    { label: "Projects & Profile", value: profileScore },
  ];
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Match Breakdown
      </p>
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-slate-600">{r.label}</span>
            <span className="font-medium tabular-nums text-slate-900">{Math.round(r.value)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-600"
              style={{ width: `${Math.min(r.value, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
