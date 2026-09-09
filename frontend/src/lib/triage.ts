import type { ScreeningResult, TriageSummary } from "@/types";

export function buildTriageSummary(results: ScreeningResult[]): TriageSummary {
  const immediate: string[] = [];
  const queue: string[] = [];
  const archive: string[] = [];
  const integrityReview: string[] = [];

  for (const candidate of results) {
    const name = candidate.candidate_name;
    const score = candidate.final_score;
    const risk = candidate.integrity_check?.risk_level ?? "low";

    if (risk === "medium" || risk === "high") {
      integrityReview.push(name);
    }
    if (score >= 75) immediate.push(name);
    else if (score >= 45) queue.push(name);
    else archive.push(name);
  }

  const total = results.length;
  const manualMinutesSaved = total * 12;

  return {
    total_screened: total,
    immediate_review: immediate,
    queue_review: queue,
    auto_archive: archive,
    integrity_review: integrityReview,
    immediate_count: immediate.length,
    queue_count: queue.length,
    archive_count: archive.length,
    integrity_flag_count: integrityReview.length,
    estimated_hours_saved: Math.round((manualMinutesSaved / 60) * 10) / 10,
    summary: `${immediate.length} ready for review, ${queue.length} in queue, ${archive.length} auto-archived.`,
  };
}
