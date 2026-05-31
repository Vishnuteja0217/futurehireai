"use client";

import { Download } from "lucide-react";
import { useState } from "react";

import { useResumeAnalysis } from "@/contexts/ResumeAnalysisContext";
import { downloadTailoredResume } from "@/lib/api";

export function TailoredResume() {
  const {
    tailoredResume,
    tailoringLoading,
    generateTailored,
    initialAtsScore,
  } = useResumeAnalysis();

  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<
    "" | "docx" | "pdf"
  >("");

  const handleDownload = async (format: "docx" | "pdf") => {
    if (!tailoredResume) return;
    try {
      setDownloadingFormat(format);
      await downloadTailoredResume(format, tailoredResume.tailored_resume);
    } catch (err) {
      console.error(err);
      alert("Download failed. Please try again.");
    } finally {
      setDownloadingFormat("");
      setShowDownloadOptions(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900">
          Tailored Resume
        </h3>
      </div>

      <p className="mb-5 text-sm text-slate-600">
        Generate an AI-optimized version of your resume targeted at this exact
        job description.
      </p>

      <button
        type="button"
        onClick={generateTailored}
        disabled={tailoringLoading}
        className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
      >
        {tailoringLoading ? "Tailoring Resume..." : "Generate Tailored Resume"}
      </button>

      {tailoredResume && (
        <div className="mt-6 space-y-6">
          {/* ─── ATS Score Comparison (before → after) ───────────────── */}
          {/* Money-shot moment: shows the lift from the original resume's */}
          {/* ATS score to the projected score after tailoring. The numbers */}
          {/* are both real (no fake metrics). Falls back gracefully if   */}
          {/* the user somehow got here without running Analyze first.    */}
          <ScoreComparisonCard
            originalScore={initialAtsScore}
            tailoredScore={tailoredResume.projected_ats_score_after_tailoring}
          />

          {/* Reasoning */}
          {tailoredResume.ats_score_reasoning?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Why this score
              </h4>
              <div className="mt-2 space-y-2">
                {tailoredResume.ats_score_reasoning.map((item, i) => (
                  <p key={i} className="text-sm leading-6 text-slate-600">
                    • {item}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Resume + download */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">
                Tailored Resume
              </h4>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDownloadOptions((p) => !p)}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>

                {showDownloadOptions && (
                  <div className="absolute right-0 mt-2 flex gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                    <button
                      type="button"
                      onClick={() => handleDownload("docx")}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                    >
                      {downloadingFormat === "docx" ? "..." : "Word"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload("pdf")}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                    >
                      {downloadingFormat === "pdf" ? "..." : "PDF"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-700">
              {tailoredResume.tailored_resume}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ScoreComparisonCard ──────────────────────────────────────────
// Side-by-side "Original → Tailored" ATS score visual.
//
// Defensive: if originalScore is null (user came here without running
// Analyze first), we show only the projected score in a single card so
// nothing breaks. The comparison only appears when we have both numbers.
function ScoreComparisonCard({
  originalScore,
  tailoredScore,
}: {
  originalScore: number | null;
  tailoredScore: number;
}) {
  // Single-score fallback when we don't have a before-state.
  if (originalScore === null) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
          Projected ATS Match
        </p>
        <p className="mt-2 flex items-baseline gap-1.5">
          <span className="text-4xl font-bold text-emerald-700">
            {tailoredScore}
          </span>
          <span className="text-xl font-semibold text-emerald-600">%</span>
        </p>
        <p className="mt-1 text-sm text-emerald-700/80">
          Estimated ATS match after tailoring
        </p>
      </div>
    );
  }

  // Both numbers present — show the full comparison.
  const delta = tailoredScore - originalScore;
  const isImprovement = delta > 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
        ATS Score Improvement
      </p>

      <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-4">
        {/* BEFORE */}
        <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-5 text-center">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Original Resume
          </p>
          <p className="flex items-baseline justify-center gap-0.5">
            <span className="text-4xl font-bold text-amber-600 md:text-5xl">
              {originalScore}
            </span>
            <span className="text-xl font-semibold text-slate-400">%</span>
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {originalScore < 70 ? "Needs work" : "Decent match"}
          </p>
        </div>

        {/* Arrow */}
        <div className="flex shrink-0 items-center justify-center md:px-2">
          <svg
            className="h-6 w-6 rotate-90 text-slate-400 md:h-7 md:w-7 md:rotate-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </div>

        {/* AFTER */}
        <div className="flex-1 rounded-2xl border-2 border-emerald-300 bg-emerald-50/60 p-5 text-center">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            Tailored Resume
          </p>
          <p className="flex items-baseline justify-center gap-0.5">
            <span className="text-4xl font-bold text-emerald-600 md:text-5xl">
              {tailoredScore}
            </span>
            <span className="text-xl font-semibold text-emerald-500">%</span>
          </p>
          {isImprovement && (
            <p className="mt-1 text-[11px] font-semibold text-emerald-700">
              +{delta} points
            </p>
          )}
          {!isImprovement && (
            <p className="mt-1 text-[11px] text-slate-500">
              Recruiter-ready
            </p>
          )}
        </div>
      </div>
    </div>
  );
}