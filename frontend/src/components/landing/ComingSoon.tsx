import { Briefcase, Linkedin, Map, Sparkles, TrendingUp } from "lucide-react";

import { SectionHeading } from "./Features";

// These are aspirational features — be honest about that.
// Renaming or removing items here is fine; just keep the structure consistent.
const upcoming = [
  {
    icon: Briefcase,
    title: "AI Job Applications",
    description: "Apply to jobs in one click with AI assistance.",
  },
  {
    icon: Sparkles,
    title: "Smart Job Matching",
    description: "Get matched with the best jobs for your skills.",
  },
  {
    icon: Map,
    title: "Career Roadmaps",
    description: "Personalized roadmaps to achieve your dream role.",
  },
  {
    icon: Linkedin,
    title: "LinkedIn Optimization",
    description: "Make your LinkedIn profile stand out to recruiters.",
  },
  {
    icon: TrendingUp,
    title: "Salary Insights",
    description: "Accurate salary insights for your desired roles.",
  },
];

export function ComingSoon() {
  return (
    <section id="roadmap" className="px-6 py-20">
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeading
          eyebrow="What's Coming Next"
          title="Building the Future of Career Growth"
        />

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {upcoming.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="relative rounded-2xl border border-slate-200 bg-white p-6"
              >
                <span className="absolute right-4 top-4 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                  Soon
                </span>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
