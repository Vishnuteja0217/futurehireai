"use client";

import { useUser } from "@clerk/nextjs";
import { Check, Copy, Download, FileText, Info, Loader2, Mail, Sparkles } from "lucide-react";
import { useState } from "react";

import { LockedFeaturePage } from "@/components/layout/LockedFeaturePage";
import { ResumeUploader } from "@/components/shared/ResumeUploader";
import { useResumeAnalysis } from "@/contexts/ResumeAnalysisContext";
import { downloadCoverLetter } from "@/lib/api";
import { useSignedInTrialCount } from "@/lib/useSignedInTrialCount";

// Cover Letter Generator page.
// - Anonymous users see the LockedFeaturePage (conversion CTA).
// - Signed-in users see the actual generator.
//   - Inputs prefilled from ResumeAnalysisContext if available.
//   - Hitting "Generate" calls the backend, counts against the trial limit,
//     and renders the result below with copy + download options.
//   - The form collapses to a compact summary once a result is shown,
//     keeping focus on the generated letter.
export default function CoverLetterPage() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <LockedFeaturePage
        icon={Mail}
        tileColor="coral"
        title="Cover Letter Generator"
        description="Generate a tailored cover letter from your resume and the job description — in seconds, in your voice."
        features={[
          "Matches the company's tone and the role's needs",
          "Highlights your real experience, no invented claims",
          "Download as PDF or DOCX",
        ]}
        ctaText="Sign up free to unlock"
        ctaHref="/sign-up"
        secondaryText="Already have an account? Sign in"
        secondaryHref="/sign-in"
      />
    );
  }

  return <CoverLetterApp />;
}

// Actual generator UI — only mounts when user is signed in.
function CoverLetterApp() {
  const {
    resume,
    resumeText,
    jobDescription,
    setResume,
    setJobDescription,
    coverLetter,
    coverLetterLoading,
    generateCoverLetterAction,
    clearCoverLetter,
  } = useResumeAnalysis();

  const { hasReachedLimit, usageToday, limit, incrementUsage } =
    useSignedInTrialCount();

  // Tracks whether the form should be collapsed (after a successful generation)
  // or fully visible (before, or when user clicks "Edit inputs").
  const [formCollapsed, setFormCollapsed] = useState(Boolean(coverLetter));

  // Prefilled banner shows only when we have data from a prior Analyze step
  // AND the user hasn't generated yet (once they generate, the form collapses).
  const isPrefilled = Boolean(
    (resume || resumeText) && jobDescription.trim().length > 0,
  );

  const canGenerate =
    !coverLetterLoading &&
    !hasReachedLimit &&
    (resume !== null || resumeText.length > 0) &&
    jobDescription.trim().length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    await generateCoverLetterAction();
    // Only count the trial AFTER a successful generation (avoids burning
    // a credit on backend errors). incrementUsage is a no-op if not signed in.
    await incrementUsage();
    setFormCollapsed(true);
  };

  const handleEditInputs = () => {
    setFormCollapsed(false);
  };

  const handleNewLetter = () => {
    clearCoverLetter();
    setFormCollapsed(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">
      {/* Page header (always shown) */}
      <PageHeader
        collapsed={formCollapsed && Boolean(coverLetter)}
        onEditInputs={handleEditInputs}
      />

      {/* Form (collapses to summary when a result is shown) */}
      {!formCollapsed || !coverLetter ? (
        <Form
          resumeFile={resume}
          onResumeChange={(f) => setResume(f)}
          cachedResumeText={resumeText}
          jobDescription={jobDescription}
          onJDChange={setJobDescription}
          isPrefilled={isPrefilled}
          canGenerate={canGenerate}
          loading={coverLetterLoading}
          usageToday={usageToday}
          limit={limit}
          hasReachedLimit={hasReachedLimit}
          onGenerate={handleGenerate}
        />
      ) : null}

      {/* Result (only shown after generation) */}
      {coverLetter && (
        <Result
          text={coverLetter}
          onNewLetter={handleNewLetter}
          usageToday={usageToday}
          limit={limit}
        />
      )}
    </div>
  );
}

// ─── Section components ──────────────────────────────────────────────────

function PageHeader({
  collapsed,
  onEditInputs,
}: {
  collapsed: boolean;
  onEditInputs: () => void;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 md:text-xl">
            Cover Letter Generator
          </h1>
          <p className="text-xs text-slate-500 md:text-sm">
            {collapsed
              ? "Form collapsed — click to edit inputs and regenerate."
              : "Tailored to your resume and the role you're applying to."}
          </p>
        </div>
      </div>

      {collapsed && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          <span className="flex-1">
            Cover letter generated from your inputs.
          </span>
          <button
            type="button"
            onClick={onEditInputs}
            className="font-medium text-blue-600 transition hover:text-blue-700"
          >
            Edit inputs
          </button>
        </div>
      )}
    </div>
  );
}

function Form({
  resumeFile,
  onResumeChange,
  cachedResumeText,
  jobDescription,
  onJDChange,
  isPrefilled,
  canGenerate,
  loading,
  usageToday,
  limit,
  hasReachedLimit,
  onGenerate,
}: {
  resumeFile: File | null;
  onResumeChange: (f: File | null) => void;
  cachedResumeText: string;
  jobDescription: string;
  onJDChange: (v: string) => void;
  isPrefilled: boolean;
  canGenerate: boolean;
  loading: boolean;
  usageToday: number;
  limit: number;
  hasReachedLimit: boolean;
  onGenerate: () => void;
}) {
  // When there's no file but we have cached resume text (from a prior Analyze),
  // show a "resume from Analyze" chip instead of the empty uploader.
  const showCachedResumeChip = !resumeFile && cachedResumeText.length > 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
      {/* Trial usage badge */}
      <div className="mb-4 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-xs">
        <span className="font-medium text-blue-900">
          {usageToday} / {limit} trials this month
        </span>
        <span className="text-blue-700">
          {Math.max(0, limit - usageToday)} left
        </span>
      </div>

      {/* Prefilled info banner */}
      {isPrefilled && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs text-blue-800">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Prefilled from your last Analyze step. Replace anything below to
            use different content.
          </span>
        </div>
      )}

      {/* Resume input */}
      <div className="mb-5">
        {showCachedResumeChip ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Resume</span>
              <button
                type="button"
                onClick={() => onResumeChange(null)}
                className="text-xs font-medium text-blue-600 transition hover:text-blue-700"
              >
                Clear &amp; upload new
              </button>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">
                  Resume from Analyze
                </p>
                <p className="text-xs text-slate-500">
                  Using your previously uploaded resume
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ResumeUploader
            file={resumeFile}
            onChange={onResumeChange}
            label="Resume"
          />
        )}
      </div>

      {/* Job description input */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="cover-letter-jd"
            className="text-sm font-medium text-slate-700"
          >
            Job description
          </label>
          {jobDescription.length > 0 && (
            <button
              type="button"
              onClick={() => onJDChange("")}
              className="text-xs font-medium text-blue-600 transition hover:text-blue-700"
            >
              Clear
            </button>
          )}
        </div>
        <textarea
          id="cover-letter-jd"
          value={jobDescription}
          onChange={(e) => onJDChange(e.target.value)}
          placeholder="Paste the full job description here…"
          rows={6}
          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Generate button + limit hint */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={!canGenerate}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating…</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Generate Cover Letter</span>
          </>
        )}
      </button>

      {hasReachedLimit && (
        <p className="mt-2 text-center text-xs text-rose-600">
          You&apos;ve used all {limit} trials this month. Upgrade for more.
        </p>
      )}
    </div>
  );
}

function Result({
  text,
  onNewLetter,
  usageToday,
  limit,
}: {
  text: string;
  onNewLetter: () => void;
  usageToday: number;
  limit: number;
}) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState<"pdf" | "docx" | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleDownload = async (format: "pdf" | "docx") => {
    try {
      setDownloading(format);
      await downloadCoverLetter(format, text);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Sorry, the download failed. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
      {/* Header row with action buttons */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">
          Your cover letter
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleDownload("docx")}
            disabled={downloading !== null}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {downloading === "docx" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>DOCX</span>
          </button>
          <button
            type="button"
            onClick={() => handleDownload("pdf")}
            disabled={downloading !== null}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {downloading === "pdf" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* The letter itself — preserves line breaks */}
      <div className="rounded-xl bg-slate-50 p-5 text-sm leading-7 text-slate-800 md:p-6">
        <pre className="whitespace-pre-wrap font-sans">{text}</pre>
      </div>

      {/* Footer: cost transparency + new letter action */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-slate-400" />
          This used 1 trial. You have {Math.max(0, limit - usageToday)}{" "}
          remaining this month.
        </span>
        <button
          type="button"
          onClick={onNewLetter}
          className="font-medium text-blue-600 transition hover:text-blue-700"
        >
          Generate a new one
        </button>
      </div>
    </div>
  );
}