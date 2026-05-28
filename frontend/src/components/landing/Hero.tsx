"use client";

import { useUser } from "@clerk/nextjs";
import {
  BarChart3,
  CheckCircle2,
  FileUp,
  Info,
  Sparkles,
  Target,
} from "lucide-react";

import { useResumeAnalysis } from "@/contexts/ResumeAnalysisContext";
import { useSignedInTrialCount } from "@/lib/useSignedInTrialCount";
import { useTrialCount } from "@/lib/useTrialCount";

// The hero IS the demo: rather than show a fake dashboard preview like the
// reference mockup, we put the real upload + analyze card front and centre.
// Testers can use the product without scrolling.
export function Hero({ onShowJD, onShowAts, onShowLimit }: HeroProps) {
  const {
    resume,
    setResume,
    jobDescription,
    setJobDescription,
    loading,
    fetchingJD,
    initialAtsScore,
    analyzeJD,
  } = useResumeAnalysis();

// Auth + trial state
  const { isSignedIn, isLoaded } = useUser();

  // Anonymous counter (browser localStorage, 3 lifetime trials)
  const anon = useTrialCount();

  // Signed-in counter (Clerk metadata, 5/day, auto-resets at midnight UTC)
  const signed = useSignedInTrialCount();

  // Pick the right counter for the current auth state
  const trialsRemaining = isSignedIn ? signed.usageRemaining : anon.trialsRemaining;
  const limit = isSignedIn ? signed.limit : 3;
  const hasReachedLimit = isSignedIn ? signed.hasReachedLimit : anon.hasReachedLimit;
  const hydrated = isSignedIn ? signed.hydrated : anon.hydrated;

  const isBlocked = isLoaded && hydrated && hasReachedLimit;

  // Wrapper that bumps the correct counter on each successful analyze.
  const handleAnalyze = async () => {
    if (isBlocked) {
      onShowLimit();
      return;
    }
    await analyzeJD();
    if (isSignedIn) {
      await signed.incrementUsage();
    } else {
      anon.incrementTrial();
    }
  };

  const analyzeLabel = fetchingJD
    ? "Fetching JD..."
    : loading
      ? "Analyzing..."
      : "Analyze";

  return (
    <section className="relative overflow-hidden pb-16 pt-12 md:pt-20">
      {/* Decorative background — subtle, not the cliched purple-on-white */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -right-32 top-40 h-[420px] w-[420px] rounded-full bg-indigo-200/40 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-6">
        {/* Intro */}
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Career Intelligence — Beta
          </div>

          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl">
            Your AI Copilot for{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Career Growth.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 md:text-lg md:leading-8">
            Optimize your resume, prepare for interviews, improve ATS scores,
            and generate tailored career insights — all from one intelligent
            platform.
          </p>

          {/* Trust badges — sit below the headline, matching the reference */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-600">
            <TrustBadge icon={<BarChart3 className="h-4 w-4 text-blue-600" />}>
              AI-Powered Insights
            </TrustBadge>
            <TrustBadge icon={<Target className="h-4 w-4 text-indigo-600" />}>
              Personalized Guidance
            </TrustBadge>
            <TrustBadge
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            >
              Beta Access — Free
            </TrustBadge>
          </div>
        </div>

    {/* Trial badge — different messaging for anonymous vs signed-in users */}
        {isLoaded && hydrated && (
          <div className="mx-auto mt-10 flex max-w-5xl items-center justify-center">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${
                hasReachedLimit
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : trialsRemaining === 1
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-blue-200 bg-blue-50 text-blue-700"
              }`}
            >
              <Info className="h-3.5 w-3.5" />
              {isSignedIn
                ? hasReachedLimit
                  ? "Daily limit reached — Pro coming soon"
                  : `${trialsRemaining} of ${limit} analyses left today`
                : hasReachedLimit
                  ? "Free trials used — sign up for 5/day"
                  : `${trialsRemaining} of 3 free trials remaining`}
            </div>
          </div>
        )}

        {/* Upload + JD card */}
        <div
          id="upload"
          className="mx-auto mt-4 w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/5 md:p-6"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr_180px]">
            {/* Resume upload slot */}
            <ResumeUpload
              file={resume}
              onSelect={(file) => setResume(file)}
            />

            {/* JD input */}
            <div className="flex flex-col">
              <textarea
                placeholder="Paste a job description or paste a JD URL..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="h-20 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />

              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  {jobDescription.length} characters
                </p>

                {jobDescription.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={onShowJD}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    View full JD →
                  </button>
                )}
              </div>
            </div>

            {/* ATS / Analyze slot */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  ATS Score
                </p>
                {initialAtsScore !== null ? (
                  <button
                    type="button"
                    onClick={onShowAts}
                    className="mt-1 flex items-baseline gap-1 transition hover:opacity-80"
                  >
                    <span className="text-3xl font-bold text-slate-900">
                      {initialAtsScore}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">
                      %
                    </span>
                  </button>
                ) : (
                  <p className="mt-1 text-sm text-slate-400">—</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={loading || fetchingJD}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
              >
                {isBlocked
                  ? isSignedIn
                    ? "Come back tomorrow"
                    : "Sign up to continue"
                  : analyzeLabel}
              </button>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            We never share or sell your resume data. PDF, DOC, DOCX supported.
          </p>
        </div>
      </div>
    </section>
  );
}

interface HeroProps {
  onShowJD: () => void;
  onShowAts: () => void;
  onShowLimit: () => void;
}

function TrustBadge({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="font-medium">{children}</span>
    </div>
  );
}

// Extracted because the resume slot has two visual states
// (empty vs filename) — easier to read isolated.
function ResumeUpload({
  file,
  onSelect,
}: {
  file: File | null;
  onSelect: (f: File) => void;
}) {
  const baseClasses =
    "flex h-20 cursor-pointer items-center justify-center gap-2 rounded-2xl border px-4 text-center text-sm font-semibold transition";

  if (file) {
    return (
      <label
        className={`${baseClasses} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`}
      >
        <FileUp className="h-4 w-4 shrink-0" />
        <span className="max-w-[160px] truncate">{file.name}</span>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              onSelect(e.target.files[0]);
              e.target.value = "";
            }
          }}
        />
      </label>
    );
  }

  return (
    <label
      className={`${baseClasses} border-dashed border-slate-300 bg-slate-50 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700`}
    >
      <FileUp className="h-4 w-4" />
      Upload Resume
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            onSelect(e.target.files[0]);
            e.target.value = "";
          }
        }}
      />
    </label>
  );
}
