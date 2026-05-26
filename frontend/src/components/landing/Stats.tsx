"use client";

import { Bot, Clock, Sparkles, Zap } from "lucide-react";

// Honest beta-stage stats. Easy to swap in real numbers once you have them.
// IMPORTANT: don't put "12K+ resumes analyzed" unless that's actually true —
// testers will smell the inflation and lose trust.
const stats = [
  {
    icon: Sparkles,
    value: "AI-First",
    label: "Built for the modern job hunt",
    iconBg: "bg-blue-100 text-blue-600",
  },
  {
    icon: Zap,
    value: "Instant",
    label: "Resume × JD analysis",
    iconBg: "bg-indigo-100 text-indigo-600",
  },
  {
    icon: Bot,
    value: "Mock",
    label: "Interview practice rounds",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: Clock,
    value: "24/7",
    label: "Always-on AI assistant",
    iconBg: "bg-amber-100 text-amber-600",
  },
];

export function Stats() {
  return (
    <section className="px-6 py-12">
      <div className="mx-auto w-full max-w-7xl rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm md:px-10">
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
                <div>
                  <p className="text-xl font-bold text-slate-900 md:text-2xl">
                    {s.value}
                  </p>
                  <p className="text-xs text-slate-500 md:text-sm">
                    {s.label}
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
