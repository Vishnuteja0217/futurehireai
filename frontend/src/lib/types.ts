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
