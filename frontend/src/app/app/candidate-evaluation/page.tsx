"use client";

import { useUser } from "@clerk/nextjs";
import { ChartBar, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AnalysisCard } from "@/components/analysis/AnalysisCard";
import { LockedFeaturePage } from "@/components/layout/LockedFeaturePage";
import { useResumeAnalysis } from "@/contexts/ResumeAnalysisContext";

// Candidate Evaluation as its own sidebar page.
//
// Holds the 3 analysis-output tabs (Overview, Resume Fixes, Interview Prep).
// Reads the analysis data from ResumeAnalysisContext, which is populated when
// the user runs Analyze on /app. Tabs map to slices of the analysis array
// using the same index ranges that AnalysisResults used to use.
//
// Three render states:
//   1. Anonymous → LockedFeaturePage (conversion CTA)
//   2. Signed-in, no analysis yet → empty state pointing to /app
//   3. Signed-in with analysis → the tabbed evaluation view

const tabs = [
  { id: "overview", label: "Overview", range: [0, 4] as const },
  { id: "resume", label: "Resume Fixes", range: [4, 7] as const },
  { id: "prep", label: "Interview Prep", range: [7, 11] as const },
];

export default function CandidateEvaluationPage() {
  const { isSignedIn, isLoaded } = useUser();
  const { analysis } = useResumeAnalysis();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <LockedFeaturePage
        icon={Sparkles}
        tileColor="purple"
        title="Candidate Evaluation"
        description="Get a personalized evaluation of your resume against any job description — strengths, gaps, and what recruiters are scanning for."
        features={[
          "Overview: strengths, gaps, rejection risks",
          "Resume Fixes: specific bullet improvements",
          "Interview Prep: study areas + likely questions",
        ]}
        ctaText="Sign up free to unlock"
        ctaHref="/sign-up"
        secondaryText="Already have an account? Sign in"
        secondaryHref="/sign-in"
      />
    );
  }

  if (analysis.length === 0) {
    return <EmptyState />;
  }

  return <EvaluationView />;
}

// ─── Main evaluation view ─────────────────────────────────────────
function EvaluationView() {
  const { analysis } = useResumeAnalysis();
  const [activeTab, setActiveTab] = useState<string>("overview");

  const currentTab = tabs.find((t) => t.id === activeTab);
  const sections = currentTab
    ? analysis.slice(currentTab.range[0], currentTab.range[1])
    : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
      {/* Header */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 md:text-xl">
              Candidate Evaluation
            </h1>
            <p className="text-xs text-slate-500 md:text-sm">
              Personalized insights based on your resume and the job description
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 md:p-8">
        {/* Tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white shadow-sm shadow-purple-600/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="space-y-6">
          {sections.map((section, i) => (
            <AnalysisCard key={i} section={section} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm md:p-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
          <Sparkles className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">
          No evaluation yet
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
          Your candidate evaluation appears here after you run an analysis.
          Upload your resume + the job description on the Analyze page to get
          started.
        </p>
        <Link
          href="/app"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <ChartBar className="h-4 w-4" />
          <span>Go to Analyze</span>
        </Link>
      </div>
    </div>
  );
}