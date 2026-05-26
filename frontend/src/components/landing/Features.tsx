import {
  BarChart3,
  Briefcase,
  FileText,
  Lightbulb,
  MessagesSquare,
} from "lucide-react";

// 5 features, mirroring the reference. Keep titles short so cards align.
// Edit `description` to match your actual product capabilities.
const features = [
  {
    icon: FileText,
    title: "AI Resume Analyzer",
    description:
      "Get AI-powered feedback to improve your resume and beat ATS systems before you hit apply.",
    iconBg: "bg-blue-100 text-blue-600",
  },
  {
    icon: MessagesSquare,
    title: "Interview Preparation",
    description:
      "Practice role-specific interviews with realistic mock sessions and instant AI feedback.",
    iconBg: "bg-indigo-100 text-indigo-600",
  },
  {
    icon: BarChart3,
    title: "ATS Score Intelligence",
    description:
      "Analyze and improve your ATS score with concrete, actionable recommendations.",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: Lightbulb,
    title: "Career Insights",
    description:
      "Discover skill gaps, in-demand skills, and personalized career tips tied to your goals.",
    iconBg: "bg-amber-100 text-amber-600",
  },
  {
    icon: Briefcase,
    title: "AI Job Applications",
    description:
      "Apply to jobs directly from FutureHireAI with one click — backed by AI tailoring.",
    iconBg: "bg-rose-100 text-rose-600",
    comingSoon: true,
  },
];

export function Features() {
  return (
    <section id="features" className="px-6 py-20">
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeading
          eyebrow="Powerful Features"
          title="Everything You Need to Succeed"
          subtitle="FutureHireAI gives you the tools and insights to stand out and get hired."
        />

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
              >
                {f.comingSoon && (
                  <span className="absolute right-4 top-4 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                    Coming Soon
                  </span>
                )}

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${f.iconBg}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  {f.title}
                </h3>

                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Shared "eyebrow + title + subtitle" header used by several landing sections.
// Kept inline (rather than its own file) because it's only used in landing/.
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base leading-7 text-slate-600">{subtitle}</p>
      )}
    </div>
  );
}
