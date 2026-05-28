"use client";

import { useUser } from "@clerk/nextjs";
import { ClipboardList } from "lucide-react";

import { LockedFeaturePage } from "@/components/layout/LockedFeaturePage";

export default function TrackerPage() {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <LockedFeaturePage
        icon={ClipboardList}
        tileColor="amber"
        title="Application Tracker"
        description="Track every job you apply to in one place. Status, notes, contacts, deadlines — no more spreadsheets."
        features={[
          "Save every application with one click",
          "Track status: applied, interviewing, offered",
          "Pro feature — coming soon",
        ]}
        ctaText="Sign up to get notified"
        ctaHref="/sign-up"
        secondaryText="Already have an account? Sign in"
        secondaryHref="/sign-in"
      />
    );
  }

  // Signed-in: feature isn't built yet, show coming-soon state
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <ClipboardList className="h-7 w-7" />
        </div>
        <span className="mb-3 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700">
          Coming Soon
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Application Tracker
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Track every application in one place — status, notes, contacts.
          We&apos;re building this now. It&apos;ll be a Pro feature when it
          ships.
        </p>
      </div>
    </div>
  );
}