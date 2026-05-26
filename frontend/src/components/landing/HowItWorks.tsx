import { Sparkles, Target, Upload } from "lucide-react";

import { SectionHeading } from "./Features";

// Numbered 3-step "journey" — the same idea as the reference mockup's
// "Your Journey to the Right Job in 3 Steps". Keep this as the only
// how-it-works section; don't duplicate it with a product-flow above the hero.
const steps = [
  {
    n: "1",
    icon: Upload,
    title: "Upload Your Resume",
    description: "Drop in your resume and the job description you're targeting.",
  },
  {
    n: "2",
    icon: Sparkles,
    title: "Get AI-Powered Insights",
    description:
      "Our AI analyzes your profile and gives personalized recommendations.",
  },
  {
    n: "3",
    icon: Target,
    title: "Improve, Prepare & Succeed",
    description:
      "Optimize your resume, practice interviews, and become interview-ready.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-20">
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeading
          eyebrow="How It Works"
          title="Your Journey to the Right Job in 3 Steps"
        />

        <div className="relative mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
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

                <div className="mt-6 w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
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
