"use client";

import { useUser } from "@clerk/nextjs";
import { ChartBar, Mic } from "lucide-react";
import Link from "next/link";

import { LockedFeaturePage } from "@/components/layout/LockedFeaturePage";
import { MockInterview } from "@/components/analysis/MockInterview";
import { useResumeAnalysis } from "@/contexts/ResumeAnalysisContext";

// Mock Interview as its own sidebar page.
// 3 render states:
//   1. Anonymous → LockedFeaturePage (conversion CTA)
//   2. Signed-in, no analysis yet → friendly empty state pointing to Analyze
//   3. Signed-in with analysis → the real MockInterview component
//
// The MockInterview component reads questions from ResumeAnalysisContext,
// which lives in /app/layout.tsx → state carries across pages.
export default function MockInterviewPage() {
  const { isSignedIn, isLoaded } = useUser();
  const { analysis } = useResumeAnalysis();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <LockedFeaturePage
        icon={Mic}
        tileColor="green"
        title="AI Mock Interview"
        description="Practice realistic interview questions for any job, then get instant AI feedback on your answers."
        features={[
          "Questions tailored to your target role",
          "Feedback on clarity, substance, and confidence",
          "Practice until you're truly ready",
        ]}
        ctaText="Sign up free to unlock"
        ctaHref="/sign-up"
        secondaryText="Already have an account? Sign in"
        secondaryHref="/sign-in"
      />
    );
  }

  // Signed-in but no questions yet — they haven't run Analyze.
  // Mock Interview questions come from the analysis output, so we send
  // them there with a clean empty state.
  const hasQuestions = (analysis[11]?.items?.length ?? 0) > 0;

  if (!hasQuestions) {
    return <EmptyState />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">
      {/* Page header — matches the styling we use on Cover Letter */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <Mic className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 md:text-xl">
              AI Mock Interview
            </h1>
            <p className="text-xs text-slate-500 md:text-sm">
              Practice questions tailored to your role · Get AI feedback on every answer
            </p>
          </div>
        </div>
      </div>

      {/* The actual feature — unchanged from where it lived before */}
      <MockInterview />
    </div>
  );
}

// Friendly nudge for signed-in users who haven't analyzed yet.
function EmptyState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm md:p-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <Mic className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">
          No questions yet
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
          Mock Interview questions are generated from your resume + the job
          description. Run an analysis first to get a personalized question set.
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