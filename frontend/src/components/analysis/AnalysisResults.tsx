"use client";

import { useState } from "react";

import { useResumeAnalysis } from "@/contexts/ResumeAnalysisContext";
import { AnalysisCard } from "./AnalysisCard";
import { MockInterview } from "./MockInterview";
import { TailoredResume } from "./TailoredResume";

// Tab configuration — controls which analysis sections show under each tab.
// Tab "indices" reference the order of sections set up in the context
// (0=Top Strengths, 1=Critical Gaps, ..., 11=Mock Interview Questions).
const tabs = [
  { id: "overview", label: "Overview", range: [0, 4] as const },
  { id: "resume", label: "Resume Fixes", range: [4, 7] as const },
  { id: "prep", label: "Interview Prep", range: [7, 11] as const },
  { id: "mock", label: "Mock Interview", range: null },
  { id: "tailored", label: "Tailored Resume", range: null },
];

export function AnalysisResults() {
  const { analysis } = useResumeAnalysis();
  const [activeTab, setActiveTab] = useState<string>("overview");

  if (analysis.length === 0) return null;

  return (
    <section className="px-6 pb-16">
      <div className="mx-auto w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 md:p-8">
        <h2 className="mb-2 text-2xl font-bold text-slate-900 md:text-3xl">
          Candidate Evaluation
        </h2>
        <p className="mb-8 text-sm text-slate-600">
          Personalized insights based on your resume and this job description.
        </p>

        {/* Tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="space-y-6">
          {(activeTab === "overview" ||
            activeTab === "resume" ||
            activeTab === "prep") && (
            <>
              {tabs
                .find((t) => t.id === activeTab)
                ?.range &&
                analysis
                  .slice(
                    tabs.find((t) => t.id === activeTab)!.range![0],
                    tabs.find((t) => t.id === activeTab)!.range![1],
                  )
                  .map((section, i) => (
                    <AnalysisCard key={i} section={section} />
                  ))}
            </>
          )}

          {activeTab === "mock" && <MockInterview />}
          {activeTab === "tailored" && <TailoredResume />}
        </div>
      </div>
    </section>
  );
}
