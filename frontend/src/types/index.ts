export type CandidateStatus =
  | "applied"
  | "ai_screened"
  | "reviewed"
  | "shortlisted"
  | "interview"
  | "selected"
  | "rejected";

export type JobStatus = "active" | "paused" | "closed" | "draft";

export type MatchLabel = "Strong Match" | "Good Match" | "Consider" | "Low Match";

export type Recommendation = {
  summary: string;
  strengths: string[];
  concerns: string[];
  recommended_action: string;
  priority: string;
  ai_explanation: string;
};

export type MatchingBreakdown = {
  skill_weight: number;
  similarity_weight: number;
  profile_weight: number;
  skill_contribution: number;
  similarity_contribution: number;
  profile_contribution: number;
};

export type ScreeningResult = {
  rank: number;
  candidate_name: string;
  extracted_skills: string[];
  education: string[];
  certifications: string[];
  internships: string[];
  projects: string[];
  keywords: string[];
  matched_skills: string[];
  missing_skills: string[];
  skill_score: number;
  similarity_score: number;
  profile_score: number;
  final_score: number;
  decision: string;
  explanation: string;
  recommendation: Recommendation;
  matching_breakdown: MatchingBreakdown;
};

export type ScreeningResponse = {
  message: string;
  total_candidates: number;
  report_path?: string;
  auto_extracted_skills?: string[];
  job_description_used?: string;
  results: ScreeningResult[];
};

export type ScoringWeights = {
  requiredSkills: number;
  experience: number;
  projects: number;
  education: number;
  certifications: number;
  preferredSkills: number;
  keywords: number;
};

export type Job = {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experience: string;
  education: string;
  certifications: string[];
  status: JobStatus;
  createdAt: string;
  scoringWeights: ScoringWeights;
};

export type Candidate = ScreeningResult & {
  id: string;
  jobId: string;
  status: CandidateStatus;
  email?: string;
  location?: string;
  experienceYears?: number;
  fileName?: string;
  uploadedAt: string;
};

export type Interview = {
  id: string;
  candidateId: string;
  jobId: string;
  date: string;
  type: string;
  interviewer: string;
  status: "scheduled" | "completed" | "cancelled";
};

export type ResumeRecord = {
  id: string;
  candidateId?: string;
  candidateName: string;
  fileName: string;
  jobId: string;
  uploadedAt: string;
  status: "queued" | "analyzing" | "analyzed" | "failed";
  match?: number;
};

export type JobTemplate = {
  id: string;
  name: string;
  department: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experience: string;
  education: string;
  scoringWeights: ScoringWeights;
  description: string;
};

export type AISettings = {
  strongMatchMin: number;
  goodMatchMin: number;
  considerMin: number;
  semanticMatching: boolean;
  explanationStyle: "concise" | "detailed";
  defaultWeights: ScoringWeights;
};

export type ToastMessage = {
  id: string;
  title: string;
  description?: string;
  type?: "success" | "error" | "info";
};
