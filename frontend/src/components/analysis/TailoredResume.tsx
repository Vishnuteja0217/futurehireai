"use client";

import { Download } from "lucide-react";
import { useState } from "react";

import { useResumeAnalysis } from "@/contexts/ResumeAnalysisContext";
import { downloadTailoredResume } from "@/lib/api";

export function TailoredResume() {
  const { tailoredResume, tailoringLoading, generateTailored } =
    useResumeAnalysis();

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
          {/* Score block */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Projected ATS Match
            </p>
            <p className="mt-2 flex items-baseline gap-1.5">
              <span className="text-4xl font-bold text-emerald-700">
                {tailoredResume.projected_ats_score_after_tailoring}
              </span>
              <span className="text-xl font-semibold text-emerald-600">%</span>
            </p>
            <p className="mt-1 text-sm text-emerald-700/80">
              Estimated ATS match after tailoring
            </p>
          </div>

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
