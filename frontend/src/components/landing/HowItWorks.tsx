import { FileCheck2, Search, Upload } from "lucide-react";

import { SectionHeading } from "./Features";

// The actual product flow — upload once, search, check ATS, apply.
// Keep this as the only how-it-works section; don't duplicate it elsewhere.
const steps = [
  {
    n: "1",
    icon: Upload,
    title: "Upload your resume",
    description:
      "One time. Your resume stays with you for every job you check.",
  },
  {
    n: "2",
    icon: Search,
    title: "Search jobs",
    description:
      "Real jobs from LinkedIn, Indeed, and more. H1B sponsors ranked first.",
  },
  {
    n: "3",
    icon: FileCheck2,
    title: "Check match. Apply.",
    description:
      "Honest ATS score, where you fit, where you lack. Tailor and apply with confidence.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-12">
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps from search to submit."
        />

        <div className="relative mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Dotted connector behind cards on desktop */}
          <div
            className="absolute left-0 right-0 top-7 -z-10 hidden h-px md:block"
            style={{
              background:
                "repeating-linear-gradient(to right, rgb(203 213 225) 0 6px, transparent 6px 12px)",
            }}
          />

          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.n} className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-600/30">
                    <span className="text-lg font-bold">{s.n}</span>
                  </div>
                </div>

                <div className="mt-5 w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-slate-900">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">
                    {s.description}
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