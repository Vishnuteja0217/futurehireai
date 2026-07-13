"use client";

import { Briefcase, FileCheck2, Globe, Shield } from "lucide-react";

// Real, defensible stats. Nothing inflated — every number here traces to
// verifiable data (USCIS filings, JSearch coverage, our own scoring model).
// If you can't cite the source, don't put it here.
const stats = [
  {
    icon: Briefcase,
    value: "62,983",
    label: "H1B sponsor companies",
    sub: "USCIS FY2025 LCA filings",
    iconBg: "bg-blue-100 text-blue-600",
  },
  {
    icon: Globe,
    value: "10+",
    label: "Job platforms indexed",
    sub: "LinkedIn, Indeed, Glassdoor & more",
    iconBg: "bg-indigo-100 text-indigo-600",
  },
  {
    icon: FileCheck2,
    value: "Real",
    label: "ATS scores",
    sub: "No inflation. No vanity numbers.",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: Shield,
    value: "USCIS",
    label: "Sponsor data source",
    sub: "Official government filings",
    iconBg: "bg-amber-100 text-amber-600",
  },
];

export function Stats() {
  return (
    <section className="px-6 py-8">
      <div className="mx-auto w-full max-w-7xl rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm md:px-10">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="flex items-center gap-4"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${s.iconBg}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-slate-900 md:text-2xl">
                    {s.value}
                  </p>
                  <p className="text-xs font-medium text-slate-700 md:text-sm">
                    {s.label}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-tight text-slate-400">
                    {s.sub}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}