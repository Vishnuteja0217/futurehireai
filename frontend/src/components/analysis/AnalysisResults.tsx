"use client";

import { useResumeAnalysis } from "@/contexts/ResumeAnalysisContext";
import { TailoredResume } from "./TailoredResume";

// Post-analyze section that lives on /app.
// Previously held all 4 analysis tabs (Overview, Resume Fixes, Interview Prep,
// Tailored Resume). After the architecture refactor:
//   - Overview / Resume Fixes / Interview Prep moved to /app/candidate-evaluation
//   - Only Tailored Resume remains here
//
// Since there's nothing to switch between, the tab wrapper is gone. We render
// TailoredResume directly inside a thin container.
export function AnalysisResults() {
  const { analysis } = useResumeAnalysis();

  // No analysis yet → render nothing. Hero stays as the focal point.
  if (analysis.length === 0) return null;

  return (
    <section className="px-6 pb-16">
      <div className="mx-auto w-full max-w-5xl">
        <TailoredResume />
      </div>
    </section>
  );
}