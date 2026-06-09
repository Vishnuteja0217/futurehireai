"use client";

// ============================================================
// SkillConfirmationModal
//
// Shown AFTER /detect-missing-skills returns tools the JD mentions
// but the candidate's resume doesn't include. We ask the candidate
// "have you actually used these?" — they pick Yes/No for each.
//
// Only the "Yes" skills get passed to /generate-tailored-resume
// as confirmed_skills. This is what keeps the tailoring honest
// (we only add tools the candidate verified) while still letting
// the score legitimately climb for candidates whose resume was
// just missing keywords for real experience.
// ============================================================

import { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";

interface SkillConfirmationModalProps {
  missingSkills: string[];
  onConfirm: (confirmedSkills: string[]) => void;
  onSkip: () => void;
  isLoading?: boolean;
}

export function SkillConfirmationModal({
  missingSkills,
  onConfirm,
  onSkip,
  isLoading = false,
}: SkillConfirmationModalProps) {
  // Track Yes/No for each skill. Default: nothing selected (forces a deliberate choice).
  const [answers, setAnswers] = useState<Record<string, "yes" | "no" | null>>(
    Object.fromEntries(missingSkills.map((s) => [s, null])),
  );

  const setAnswer = (skill: string, value: "yes" | "no") => {
    setAnswers((prev) => ({ ...prev, [skill]: value }));
  };

  const confirmedSkills = Object.entries(answers)
    .filter(([, value]) => value === "yes")
    .map(([skill]) => skill);

  // User has answered every question? Only then enable "Tailor" button.
  const allAnswered = Object.values(answers).every((v) => v !== null);

  function handleConfirm() {
    onConfirm(confirmedSkills);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200">
          <button
            onClick={onSkip}
            disabled={isLoading}
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-lg font-semibold text-slate-900">
            Quick — have you used these?
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            The job description mentions these tools that aren&apos;t on your resume.
            Mark the ones you&apos;ve actually used — we&apos;ll add them honestly.
          </p>
        </div>

        {/* Skill list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {missingSkills.map((skill) => (
            <SkillRow
              key={skill}
              skill={skill}
              answer={answers[skill]}
              onAnswer={(value) => setAnswer(skill, value)}
              disabled={isLoading}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={onSkip}
            disabled={isLoading}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50"
          >
            Skip
          </button>

          <button
            onClick={handleConfirm}
            disabled={!allAnswered || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Tailoring...
              </>
            ) : (
              <>
                Tailor my resume
                <Check className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

// ============================================================
// Single skill row — shows skill name + Yes / No buttons
// ============================================================

function SkillRow({
  skill,
  answer,
  onAnswer,
  disabled,
}: {
  skill: string;
  answer: "yes" | "no" | null;
  onAnswer: (value: "yes" | "no") => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
      <span className="text-sm font-medium text-slate-900">{skill}</span>

      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={() => onAnswer("yes")}
          disabled={disabled}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors disabled:opacity-50 ${
            answer === "yes"
              ? "bg-emerald-600 text-white"
              : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          Yes
        </button>
        <button
          onClick={() => onAnswer("no")}
          disabled={disabled}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors disabled:opacity-50 ${
            answer === "no"
              ? "bg-rose-600 text-white"
              : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}