"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { FeedbackButton } from "@/components/landing/FeedbackButton";
import { ResumeAnalysisProvider } from "@/contexts/ResumeAnalysisContext";
import { useSignedInTrialCount } from "@/lib/useSignedInTrialCount";
import { useTrialCount } from "@/lib/useTrialCount";

// Layout for everything under /app/*.
// Structure (Pattern B):
//   ┌── Header (full width: brand left, avatar right)
//   ├── Sidebar (220px) + Main content (flex-1)
//   └── FeedbackButton (floating)
//
// The full-width header guarantees the brand and avatar live on the same
// horizontal row — no fragile pixel alignment with the sidebar.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "/app";
  const { isSignedIn, isLoaded } = useUser();

  // Both counters called unconditionally (Rules of Hooks).
  // Only the relevant one's values are passed to the sidebar.
  const anon = useTrialCount();
  const signed = useSignedInTrialCount();

  // Avoid flashing "anonymous" state while Clerk + hooks hydrate.
  const ready = isLoaded && (isSignedIn ? signed.hydrated : anon.hydrated);

  const tier = !isSignedIn ? "anonymous" : "free";
  const usageCurrent = isSignedIn ? signed.usageToday : anon.trialCount;
  const usageLimit = isSignedIn ? signed.limit : 3;

  return (
    <ResumeAnalysisProvider>
      <div className="flex min-h-screen flex-col bg-slate-50">
        {/* ─── Full-width top header ─── */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900">
              FutureHire<span className="text-blue-600">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <UserButton />
            ) : (
              <Link
                href="/sign-in"
                className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                Sign in
              </Link>
            )}
          </div>
        </header>

        {/* ─── Sidebar + Main content row ─── */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar (desktop only — mobile bottom-bar comes in Step 5) */}
          <div className="hidden md:block">
            <AppSidebar
              activePath={pathname}
              isSignedIn={isSignedIn ?? false}
              usageCurrent={ready ? usageCurrent : 0}
              usageLimit={usageLimit}
              tier={tier}
            />
          </div>

          {/* Main content */}
          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>

        <FeedbackButton />
      </div>
    </ResumeAnalysisProvider>
  );
}