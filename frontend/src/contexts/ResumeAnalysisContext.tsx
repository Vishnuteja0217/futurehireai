"use client";

// Central state for the whole upload → analyze → tailor flow.
// page.tsx wraps everything in <ResumeAnalysisProvider />, and any
// component (Hero, AnalysisResults, modals) reads via useResumeAnalysis().
// This is what replaces the ~20 useState calls in the original page.tsx.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  compareResumeJD,
  evaluateAnswer,
  extractJDFromUrl,
  generateCoverLetter,
  generateTailoredResume,
  uploadResume,
} from "@/lib/api";
import type {
  AnalysisSection,
  AnswerFeedback,
  TailoredResume,
} from "@/lib/types";

interface ResumeAnalysisContextValue {
  // Inputs
  resume: File | null;
  resumeText: string;  // cached parsed text from the last upload (shared across pages)
  jobDescription: string;
  setResume: (f: File | null) => void;
  setResumeText: (v: string) => void;
  setJobDescription: (v: string) => void;

  // Analysis output
  analysis: AnalysisSection[];
  initialAtsScore: number | null;
  initialAtsReasoning: string[];

  // Loading states
  loading: boolean;
  fetchingJD: boolean;
  feedbackLoading: boolean;
  tailoringLoading: boolean;

  // Mock interview
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (i: number | ((p: number) => number)) => void;
  mockAnswers: Record<number, string>;
  setMockAnswer: (index: number, value: string) => void;
  feedbackByQuestion: Record<number, AnswerFeedback>;

  // Tailored resume
  tailoredResume: TailoredResume | null;

  // Cover letter
  coverLetter: string | null;
  coverLetterLoading: boolean;
  generateCoverLetterAction: () => Promise<void>;
  clearCoverLetter: () => void;

  // Actions
  analyzeJD: () => Promise<void>;
  getAnswerFeedback: () => Promise<void>;
  generateTailored: () => Promise<void>;
}

const ResumeAnalysisContext = createContext<ResumeAnalysisContextValue | null>(
  null,
);

export function ResumeAnalysisProvider({ children }: { children: ReactNode }) {
  const [resume, setResume] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");

  const [analysis, setAnalysis] = useState<AnalysisSection[]>([]);
  const [initialAtsScore, setInitialAtsScore] = useState<number | null>(null);
  const [initialAtsReasoning, setInitialAtsReasoning] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetchingJD, setFetchingJD] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [tailoringLoading, setTailoringLoading] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [mockAnswers, setMockAnswers] = useState<Record<number, string>>({});
  const [feedbackByQuestion, setFeedbackByQuestion] = useState<
    Record<number, AnswerFeedback>
  >({});

  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(
    null,
  );

  const [resumeText, setResumeText] = useState<string>("");
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);

  const setMockAnswer = useCallback((index: number, value: string) => {
    setMockAnswers((prev) => ({ ...prev, [index]: value }));
  }, []);

  const analyzeJD = useCallback(async () => {
    if (!resume) return alert("Please upload your resume first.");
    if (!jobDescription.trim())
      return alert("Please paste a job description or JD link.");

    try {
      setLoading(true);

      // If input looks like a URL, fetch the JD first
      let finalJD = jobDescription;
      if (jobDescription.trim().startsWith("http")) {
        setFetchingJD(true);
        const jdData = await extractJDFromUrl(jobDescription.trim());
        if (!jdData.job_description) {
          alert("Could not extract JD from this link.");
          return;
        }
        finalJD = jdData.job_description;
        setJobDescription(jdData.job_description);
        setFetchingJD(false);
      }

      const { resume_text } = await uploadResume(resume);
      setResumeText(resume_text);  // cache for cover letter + tailored resume pages
      const data = await compareResumeJD(resume_text, finalJD);

      setInitialAtsScore(data.initial_ats_score ?? null);
      setInitialAtsReasoning(data.initial_ats_reasoning ?? []);

      // Map backend response into ordered sections the tabs read from
      setAnalysis([
        { title: "Top Strengths", items: data.top_strengths ?? [] },
        { title: "Critical Gaps", items: data.critical_gaps ?? [] },
        { title: "Recruiter Concerns", items: data.recruiter_concerns ?? [] },
        {
          title: "Likely Rejection Reasons",
          items: data.likely_rejection_reasons ?? [],
        },
        {
          title: "Technical Depth Concerns",
          items: data.technical_depth_concerns ?? [],
        },
        {
          title: "Hidden Role Expectations",
          items: data.hidden_role_expectations ?? [],
        },
        {
          title: "Resume Bullet Improvements",
          items: data.resume_bullet_improvements ?? [],
        },
        {
          title: "High Priority Study Areas",
          items: data.high_priority_study_areas ?? [],
        },
        {
          title: "Likely Interviewer Focus Areas",
          items: data.likely_interviewer_focus_areas ?? [],
        },
        {
          title: "Scenario Based Questions",
          items: data.scenario_based_questions ?? [],
        },
        {
          title: "Common Interview Questions",
          items: data.common_interview_questions ?? [],
        },
        {
          title: "Mock Interview Questions",
          items:
            data.mock_interview_questions ??
            data.scenario_based_questions ??
            [],
        },
      ]);
    } catch (err) {
      console.error(err);
      alert("Something went wrong while analyzing.");
    } finally {
      setLoading(false);
      setFetchingJD(false);
    }
  }, [resume, jobDescription]);

  const getAnswerFeedback = useCallback(async () => {
    const question = analysis[11]?.items?.[currentQuestionIndex];
    if (!question) return;

    try {
      setFeedbackLoading(true);
      const data = await evaluateAnswer(
        question,
        mockAnswers[currentQuestionIndex] || "",
        jobDescription,
      );
      setFeedbackByQuestion((prev) => ({
        ...prev,
        [currentQuestionIndex]: data,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setFeedbackLoading(false);
    }
  }, [analysis, currentQuestionIndex, mockAnswers, jobDescription]);

  const generateTailored = useCallback(async () => {
    if (!resume) return alert("Please upload your resume first.");
    if (!jobDescription.trim())
      return alert("Please paste a job description first.");

    try {
      setTailoringLoading(true);
      const { resume_text } = await uploadResume(resume);
      setResumeText(resume_text);  // cache for reuse
      const data = await generateTailoredResume(resume_text, jobDescription);
      setTailoredResume(data);
    } catch (err) {
      console.error(err);
      alert("Something went wrong while generating your tailored resume.");
    } finally {
      setTailoringLoading(false);
    }
  }, [resume, jobDescription]);

  // Cover letter generation.
  // Tries to reuse cached resumeText (set by analyzeJD or generateTailored).
  // Falls back to re-uploading if user came straight here without analyzing.
  const generateCoverLetterAction = useCallback(async () => {
    if (!resume && !resumeText) {
      return alert("Please upload your resume first.");
    }
    if (!jobDescription.trim()) {
      return alert("Please paste a job description first.");
    }

    try {
      setCoverLetterLoading(true);

      // Use cached text if available, otherwise upload + parse the file
      let textToUse = resumeText;
      if (!textToUse && resume) {
        const { resume_text } = await uploadResume(resume);
        setResumeText(resume_text);
        textToUse = resume_text;
      }

      const data = await generateCoverLetter(textToUse, jobDescription);
      setCoverLetter(data.cover_letter ?? "");
    } catch (err) {
      console.error(err);
      alert("Something went wrong while generating your cover letter.");
    } finally {
      setCoverLetterLoading(false);
    }
  }, [resume, resumeText, jobDescription]);

  const clearCoverLetter = useCallback(() => setCoverLetter(null), []);

  const value = useMemo<ResumeAnalysisContextValue>(
    () => ({
      resume,
      resumeText,
      jobDescription,
      setResume,
      setResumeText,
      setJobDescription,
      analysis,
      initialAtsScore,
      initialAtsReasoning,
      loading,
      fetchingJD,
      feedbackLoading,
      tailoringLoading,
      currentQuestionIndex,
      setCurrentQuestionIndex,
      mockAnswers,
      setMockAnswer,
      feedbackByQuestion,
      tailoredResume,
      coverLetter,
      coverLetterLoading,
      generateCoverLetterAction,
      clearCoverLetter,
      analyzeJD,
      getAnswerFeedback,
      generateTailored,
    }),
    [
      resume,
      resumeText,
      jobDescription,
      analysis,
      initialAtsScore,
      initialAtsReasoning,
      loading,
      fetchingJD,
      feedbackLoading,
      tailoringLoading,
      currentQuestionIndex,
      mockAnswers,
      setMockAnswer,
      feedbackByQuestion,
      tailoredResume,
      coverLetter,
      coverLetterLoading,
      generateCoverLetterAction,
      clearCoverLetter,
      analyzeJD,
      getAnswerFeedback,
      generateTailored,
    ],
  );

  return (
    <ResumeAnalysisContext.Provider value={value}>
      {children}
    </ResumeAnalysisContext.Provider>
  );
}

export function useResumeAnalysis() {
  const ctx = useContext(ResumeAnalysisContext);
  if (!ctx) {
    throw new Error(
      "useResumeAnalysis must be used inside <ResumeAnalysisProvider>",
    );
  }
  return ctx;
}
