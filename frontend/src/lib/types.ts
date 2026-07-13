// Single source of truth for the shapes coming back from your backend.
// Update these once if your API changes — everything else stays in sync.

export interface AnalysisSection {
  title: string;
  items: string[];
}

export interface CompareResumeResponse {
  initial_ats_score?: number;
  initial_ats_reasoning?: string[];
  top_strengths?: string[];
  critical_gaps?: string[];
  recruiter_concerns?: string[];
  likely_rejection_reasons?: string[];
  technical_depth_concerns?: string[];
  hidden_role_expectations?: string[];
  resume_bullet_improvements?: string[];
  high_priority_study_areas?: string[];
  likely_interviewer_focus_areas?: string[];
  scenario_based_questions?: string[];
  common_interview_questions?: string[];
  mock_interview_questions?: string[];
}

export interface AnswerFeedback {
  match_score?: number;
  recruiter_confidence?: string;
  recruiter_verdict?: string;
  strengths?: string[];
  improvements?: string[];
  missing_concepts?: string[];
  better_answer?: string;
  follow_up_question?: string;
}

export interface TailoredResume {
  projected_ats_score_after_tailoring: number;
  ats_score_reasoning: string[];
  tailored_resume: string;
}

// ── Job Application Tracker ───────────────────────────────────────────────────

export type ApplicationStatus =
  | "applied"
  | "phone_screen"
  | "interviewing"
  | "offer"
  | "rejected"
  | "withdrawn"
  | "ghosted";

export interface JobApplication {
  id: string;
  user_id: string;
  company: string;
  role: string;
  url: string | null;
  date_applied: string;        // ISO date string YYYY-MM-DD
  status: ApplicationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Job Search (JSearch + H1B enrichment) ─────────────────────────────────────
// Returned by POST /search-jobs. Mirrors the enriched job objects the backend
// assembles (JSearch response fields + H1B sponsor lookup from USCIS data).

export interface Job {
  job_id: string;
  title: string;
  company: string;
  company_logo: string | null;
  location: string;
  job_type: string;              // "Full-time", "Contractor", etc.
  is_remote: boolean;
  posted_at: string;             // ISO datetime string
  salary_min: number | null;
  salary_max: number | null;
  salary_period: string | null;  // "YEAR", "HOUR", etc.
  description_snippet: string;
  description_full: string;      // Full JD text (used for ATS scoring)
  apply_url: string;
  source: string;                // "LinkedIn", "Indeed", company site name
  h1b_sponsor: boolean;          // True if employer found in USCIS FY2025 data
  h1b_filings_2025: number;      // Certified filing count (0 if not a sponsor)
}

export interface JobSearchResponse {
  jobs: Job[];
  total_returned: number;
  h1b_sponsors_count: number;
  query: string;                 // The search string sent to JSearch
  cached?: boolean;              // True if returned from Supabase cache
  cache_age_hours?: number;      // How stale the cached result is
  error?: string;                // Present on failure (missing key, JSearch down)
}