"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { useResumeAnalysis } from "@/contexts/ResumeAnalysisContext";

// Self-contained mock-interview UI. The shared context already holds the
// current question index, answers map, and per-question feedback.
export function MockInterview() {
  const {
    analysis,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    mockAnswers,
    setMockAnswer,
    feedbackByQuestion,
    feedbackLoading,
    getAnswerFeedback,
  } = useResumeAnalysis();

  const questions = analysis[11]?.items ?? [];
  const total = questions.length;
  const feedback = feedbackByQuestion[currentQuestionIndex];

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          Mock interview questions will appear here after analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-2 text-xl font-semibold text-slate-900">
        Mock Interview
      </h3>
      <p className="mb-6 text-sm text-slate-600">
        Practice one recruiter-style question at a time. Get AI feedback on each
        answer.
      </p>

      {/* Question card */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Question {currentQuestionIndex + 1} of {total}
        </p>
        <h4 className="mt-2 text-base font-semibold leading-6 text-slate-900">
          {questions[currentQuestionIndex]}
        </h4>
      </div>

      {/* Answer */}
      <textarea
        value={mockAnswers[currentQuestionIndex] || ""}
        onChange={(e) => setMockAnswer(currentQuestionIndex, e.target.value)}
        placeholder="Type your answer here..."
        className="h-40 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />

      <button
        type="button"
        onClick={getAnswerFeedback}
        disabled={feedbackLoading}
        className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
      >
        {feedbackLoading ? "Reviewing..." : "Get Feedback"}
      </button>

      {/* Feedback */}
      {feedback && (
        <div className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h4 className="text-lg font-semibold text-blue-700">
            Interview Feedback
          </h4>

          <FeedbackList title="What You Did Well" items={feedback.strengths} />
          <FeedbackList title="How To Improve" items={feedback.improvements} />
          <FeedbackList
            title="Missing Concepts"
            items={feedback.missing_concepts}
          />

          {feedback.better_answer && (
            <FeedbackBlock
              title="Stronger Sample Answer"
              text={feedback.better_answer}
            />
          )}

          {feedback.follow_up_question && (
            <FeedbackBlock
              title="Follow-Up Question"
              text={feedback.follow_up_question}
            />
          )}
        </div>
      )}

      {/* Nav */}
      <div className="mt-6 flex justify-between gap-3">
        <button
          type="button"
          onClick={() =>
            setCurrentQuestionIndex((p: number) => Math.max(p - 1, 0))
          }
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <button
          type="button"
          onClick={() =>
            setCurrentQuestionIndex((p: number) => Math.min(p + 1, total - 1))
          }
          disabled={currentQuestionIndex === total - 1}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next Question
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function FeedbackList({
  title,
  items,
}: {
  title: string;
  items?: string[];
}) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h5 className="text-sm font-semibold text-slate-900">{title}</h5>
      <div className="mt-2 space-y-1.5">
        {items.map((item, i) => (
          <p key={i} className="text-sm leading-6 text-slate-600">
            • {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function FeedbackBlock({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h5 className="text-sm font-semibold text-slate-900">{title}</h5>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
