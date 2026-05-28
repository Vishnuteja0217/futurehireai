"use client";

import { useUser } from "@clerk/nextjs";
import { Users } from "lucide-react";

import { LockedFeaturePage } from "@/components/layout/LockedFeaturePage";

export default function GuidancePage() {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <LockedFeaturePage
        icon={Users}
        tileColor="pink"
        title="1-on-1 Career Guidance"
        description="Book a private session with a real tech professional. Get advice on your career path, interview prep, or specific technologies."
        features={[
          "Sessions with real engineers and tech leads",
          "Resume + portfolio review tailored to your goal",
          "$29 for 30 min · $49 for 60 min",
        ]}
        ctaText="Sign up to request a session"
        ctaHref="/sign-up"
        secondaryText="Already have an account? Sign in"
        secondaryHref="/sign-in"
      />
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-12">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <Users className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          1-on-1 Career Guidance
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          The request form is coming. You&apos;ll be able to book a session here.
        </p>
      </div>
    </div>
  );
}