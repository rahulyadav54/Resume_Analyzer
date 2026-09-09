export function getMatchLabel(score: number): "Strong Match" | "Good Match" | "Consider" | "Low Match" {
  if (score >= 90) return "Strong Match";
  if (score >= 75) return "Good Match";
  if (score >= 60) return "Consider";
  return "Low Match";
}

export function getMatchTone(score: number): string {
  if (score >= 90) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (score >= 75) return "text-indigo-700 bg-indigo-50 border-indigo-200";
  if (score >= 60) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-slate-600 bg-slate-50 border-slate-200";
}

export const DEFAULT_WEIGHTS = {
  requiredSkills: 35,
  experience: 20,
  projects: 15,
  education: 10,
  certifications: 5,
  preferredSkills: 10,
  keywords: 5,
};

export function weightsTotal(w: typeof DEFAULT_WEIGHTS): number {
  return Object.values(w).reduce((a, b) => a + b, 0);
}
