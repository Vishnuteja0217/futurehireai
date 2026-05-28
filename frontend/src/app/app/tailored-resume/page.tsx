"use client";

import { useUser } from "@clerk/nextjs";
import { FileText } from "lucide-react";

import { LockedFeaturePage } from "@/components/layout/LockedFeaturePage";

export default function TailoredResumePage() {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <LockedFeaturePage
        icon={FileText}
        tileColor="purple"
        title="Tailored Resume"
        description="Get a resume rewritten for the exact role you're applying to — keywords matched, bullets sharpened, ATS-ready."
        features={[
          "Optimized for the job description's ATS",
          "Stronger bullets without inventing experience",
          "Download as PDF or DOCX",
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
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
          <FileText className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Tailored Resume
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          We&apos;re wiring this up. Coming shortly.
        </p>
      </div>
    </div>
  );
}