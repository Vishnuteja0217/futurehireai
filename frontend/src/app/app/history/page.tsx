"use client";

import { useUser } from "@clerk/nextjs";
import { Clock } from "lucide-react";

import { LockedFeaturePage } from "@/components/layout/LockedFeaturePage";

export default function HistoryPage() {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <LockedFeaturePage
        icon={Clock}
        tileColor="slate"
        title="Analysis History"
        description="Every resume analysis, tailored resume, and cover letter — saved and revisitable. Pick up where you left off."
        features={[
          "All your past analyses in one place",
          "Re-download tailored resumes anytime",
          "Pro feature — coming soon",
        ]}
        ctaText="Sign up to get notified"
        ctaHref="/sign-up"
        secondaryText="Already have an account? Sign in"
        secondaryHref="/sign-in"
      />
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <Clock className="h-7 w-7" />
        </div>
        <span className="mb-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
          Coming Soon
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Analysis History
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Your past analyses, tailored resumes, and cover letters — all saved
          and revisitable. Pro feature, coming with launch.
        </p>
      </div>
    </div>
  );
}