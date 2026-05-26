"use client";

import { ResumeAnalysisProvider } from "@/contexts/ResumeAnalysisContext";

// Layout wrapper for everything under /app/*
// The ResumeAnalysisProvider lives here (not in the root layout) so its
// state only exists when the user is actually using the product. The
// homepage at "/" stays free of any analysis state.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ResumeAnalysisProvider>{children}</ResumeAnalysisProvider>;
}