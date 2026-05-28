"use client";

import { useUser } from "@clerk/nextjs";
import { Mail } from "lucide-react";

import { LockedFeaturePage } from "@/components/layout/LockedFeaturePage";

// Cover Letter Generator page.
// For now: anonymous users see the conversion CTA; signed-in users see
// a "Coming soon" placeholder. We'll wire the actual generator UI here
// after the navigation chassis is fully verified.
export default function CoverLetterPage() {
  const { isSignedIn, isLoaded } = useUser();

  // Don't render anything until Clerk knows the auth state — prevents
  // a flash of the locked page for users who are actually signed in.
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

  // Signed-in placeholder — we'll replace this with the actual generator UI
  // once the nav restructure is fully verified.
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-12">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <Mail className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Cover Letter Generator
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          We&apos;re wiring this up. Check back shortly — you&apos;ll be able
          to generate cover letters from any job description here.
        </p>
      </div>
    </div>
  );
}