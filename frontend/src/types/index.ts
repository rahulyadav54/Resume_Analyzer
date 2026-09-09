export type RecruiterUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  initials: string;
  department: string;
};

export type AuthSession = {
  token: string;
  refreshToken?: string;
  user: RecruiterUser;
  expiresInHours: number;
  loggedInAt: string;
  provider?: "supabase" | "local";
};

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

export type IntegrityFlag = {
  type: string;
  severity: "high" | "medium" | "low";
  message: string;
  details: string[];
};

export type IntegrityCheck = {
  integrity_score: number;
  risk_level: "low" | "medium" | "high";
  flag_count: number;
  flags: IntegrityFlag[];
  unverified_skills: string[];
  summary: string;
};

export type InterviewQuestion = {
  category: string;
  skill: string | null;
  question: string;
};

export type BiasBlindAnalysis = {
  enabled: boolean;
  standard_score: number;
  blind_score: number;
  score_delta: number;
  standard_decision: string;
  blind_decision: string;
  decision_changed: boolean;
  impact: string;
  summary: string;
};

export type DuplicateWarning = {
  is_duplicate: boolean;
  matched_candidate: string | null;
  reasons: string[];
  message: string | null;
};

export type JdQuality = {
  jd_quality_score: number;
  clarity_rating: string;
  word_count: number;
  skills_detected: number;
  suggestions: string[];
  summary: string;
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
  integrity_check?: IntegrityCheck;
  interview_questions?: InterviewQuestion[];
  bias_blind_analysis?: BiasBlindAnalysis | null;
  duplicate_warning?: DuplicateWarning | null;
};

export type ScreeningResponse = {
  message: string;
  total_candidates: number;
  report_path?: string;
  auto_extracted_skills?: string[];
  job_description_used?: string;
  jd_quality?: JdQuality;
  bias_blind_mode?: boolean;
  duplicate_alerts?: Array<{ candidate_name: string; message: string }>;
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
  biasBlindMode: boolean;
  explanationStyle: "concise" | "detailed";
  defaultWeights: ScoringWeights;
};

export type ToastMessage = {
  id: string;
  title: string;
  description?: string;
  type?: "success" | "error" | "info";
};
