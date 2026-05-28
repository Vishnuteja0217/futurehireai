"use client";

import { useUser } from "@clerk/nextjs";
import { Mic } from "lucide-react";

import { LockedFeaturePage } from "@/components/layout/LockedFeaturePage";

export default function MockInterviewPage() {
  const { isSignedIn, isLoaded } = useUser();
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

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-12">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <Mic className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          AI Mock Interview
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          We&apos;re wiring this up. Coming shortly.
        </p>
      </div>
    </div>
  );
}