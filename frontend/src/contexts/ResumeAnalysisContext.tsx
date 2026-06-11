"use client";

// Central state for the whole upload → analyze → tailor flow.
// page.tsx wraps everything in <ResumeAnalysisProvider />, and any
// component (Hero, AnalysisResults, modals) reads via useResumeAnalysis().

import { useAuth } from "@clerk/nextjs";
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
  detectMissingSkills,
  evaluateAnswer,
  extractJDFromUrl,
  generateCoverLetter,
  generateTailoredResume,
  uploadResume,
} from "@/lib/api";
import { saveHistory } from "@/lib/history";
import { useSupabaseClient } from "@/lib/supabase";
import type {
  AnalysisSection,
  AnswerFeedback,
  TailoredResume,
} from "@/lib/types";

interface ResumeAnalysisContextValue {
  // Inputs
  resume: File | null;
  resumeText: string;
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

  // Skill confirmation modal (new)
  missingSkills: string[];
  showSkillModal: boolean;
  closeSkillModal: () => void;
  confirmTailorWithSkills: (confirmedSkills: string[]) => Promise<void>;

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
  const { userId } = useAuth();
  const supabase = useSupabaseClient();
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

  // Skill confirmation modal state.
  // pendingResumeText caches the parsed resume between "click tailor" and
  // "user confirms skills" so we don't re-upload the file.
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [pendingResumeText, setPendingResumeText] = useState<string>("");

  const setMockAnswer = useCallback((index: number, value: string) => {
    setMockAnswers((prev) => ({ ...prev, [index]: value }));
  }, []);

  const analyzeJD = useCallback(async () => {
    if (!resume) return alert("Please upload your resume first.");
    if (!jobDescription.trim())
      return alert("Please paste a job description or JD link.");

// Clean slate — clear results from any previous run.
  // User clicked Analyze fresh, they don't want to see stale tailored data.
  setTailoredResume(null);
  setMissingSkills([]);
  setShowSkillModal(false);
  setPendingResumeText("");
  setMockAnswers({});
  setFeedbackByQuestion({});
  setCurrentQuestionIndex(0);
  setCoverLetter(null);
  setInitialAtsScore(null);
  setInitialAtsReasoning([]);
  setAnalysis([]);

    try {
      setLoading(true);

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
      setResumeText(resume_text);
      const data = await compareResumeJD(resume_text, finalJD);

      setInitialAtsScore(data.initial_ats_score ?? null);
      setInitialAtsReasoning(data.initial_ats_reasoning ?? []);

      const sections: AnalysisSection[] = [
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
      ];
      setAnalysis(sections);

      if (userId) {
        const jdSnippet = finalJD.slice(0, 300);
        saveHistory({
          supabase,
          userId,
          feature: "analyze",
          title: jdSnippet.split("\n")[0].slice(0, 80) || "Resume Analysis",
          atsScore: data.initial_ats_score ?? null,
          inputData: { job_description_snippet: jdSnippet },
          outputData: {
            ats_score: data.initial_ats_score,
            ats_reasoning: data.initial_ats_reasoning,
            sections,
          },
        });
      }
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

  // Helper that actually runs the tailoring backend call.
  // Both "no missing skills" and "modal confirmed" paths use this.
  const runTailoring = useCallback(
    async (resume_text: string, confirmedSkills: string[]) => {
      try {
        setTailoringLoading(true);
        const data = await generateTailoredResume(
          resume_text,
          jobDescription,
          confirmedSkills,
        );
        setTailoredResume(data);

        if (userId) {
          saveHistory({
            supabase,
            userId,
            feature: "tailored_resume",
            title:
              jobDescription.split("\n")[0].slice(0, 80) || "Tailored Resume",
            atsScore: data.projected_ats_score_after_tailoring ?? null,
            inputData: {
              job_description_snippet: jobDescription.slice(0, 300),
              confirmed_skills: confirmedSkills,
            },
            outputData: {
              projected_ats_score: data.projected_ats_score_after_tailoring,
              ats_reasoning: data.ats_score_reasoning,
              tailored_resume: data.tailored_resume,
            },
          });
        }
      } catch (err) {
        console.error(err);
        alert("Something went wrong while generating your tailored resume.");
      } finally {
        setTailoringLoading(false);
      }
    },
    [jobDescription, userId, supabase],
  );

  // Entry point: user clicked "Tailor Resume".
  // Step 1: upload + detect missing skills
  // Step 2: if any → show modal (user decides next)
  //         else  → tailor immediately with empty confirmed_skills
  const generateTailored = useCallback(async () => {
    if (!resume) return alert("Please upload your resume first.");
    if (!jobDescription.trim())
      return alert("Please paste a job description first.");

    try {
      setTailoringLoading(true);

      // Reuse cached text if we just analyzed; otherwise parse the file.
      let textToUse = resumeText;
      if (!textToUse) {
        const { resume_text } = await uploadResume(resume);
        textToUse = resume_text;
        setResumeText(resume_text);
      }

      // Check which JD tools the resume is missing
      const { missing_skills } = await detectMissingSkills(
        textToUse,
        jobDescription,
      );

      if (missing_skills.length > 0) {
        // Stash the parsed text + open the modal. The modal's callback
        // (confirmTailorWithSkills) will pick up the work from here.
        setPendingResumeText(textToUse);
        setMissingSkills(missing_skills);
        setShowSkillModal(true);
        setTailoringLoading(false);
        return;
      }

      // No missing skills detected → tailor straight through
      await runTailoring(textToUse, []);
    } catch (err) {
      console.error(err);
      setTailoringLoading(false);
      alert("Something went wrong while preparing your tailored resume.");
    }
  }, [resume, resumeText, jobDescription, runTailoring]);

  // Called by the modal after user picks Yes/No for each skill.
  // Receives the confirmed (Yes) skills list and runs the tailoring.
  const confirmTailorWithSkills = useCallback(
    async (confirmedSkills: string[]) => {
      setShowSkillModal(false);
      await runTailoring(pendingResumeText, confirmedSkills);
      // Clear modal state after we're done
      setPendingResumeText("");
      setMissingSkills([]);
    },
    [pendingResumeText, runTailoring],
  );

  // Called when user clicks Skip or X on the modal.
  // Runs tailoring with NO confirmed skills (same as "no missing skills" path).
  const closeSkillModal = useCallback(async () => {
    setShowSkillModal(false);
    if (pendingResumeText) {
      await runTailoring(pendingResumeText, []);
    }
    setPendingResumeText("");
    setMissingSkills([]);
  }, [pendingResumeText, runTailoring]);

  const generateCoverLetterAction = useCallback(async () => {
    if (!resume && !resumeText) {
      return alert("Please upload your resume first.");
    }
    if (!jobDescription.trim()) {
      return alert("Please paste a job description first.");
    }

    try {
      setCoverLetterLoading(true);

      let textToUse = resumeText;
      if (!textToUse && resume) {
        const { resume_text } = await uploadResume(resume);
        setResumeText(resume_text);
        textToUse = resume_text;
      }

      const data = await generateCoverLetter(textToUse, jobDescription);
      setCoverLetter(data.cover_letter ?? "");

      if (userId && data.cover_letter) {
        saveHistory({
          supabase,
          userId,
          feature: "cover_letter",
          title: jobDescription.split("\n")[0].slice(0, 80) || "Cover Letter",
          inputData: { job_description_snippet: jobDescription.slice(0, 300) },
          outputData: { cover_letter: data.cover_letter },
        });
      }
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
      missingSkills,
      showSkillModal,
      closeSkillModal,
      confirmTailorWithSkills,
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
      missingSkills,
      showSkillModal,
      closeSkillModal,
      confirmTailorWithSkills,
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