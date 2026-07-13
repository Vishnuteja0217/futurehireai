import {
  Briefcase,
  ClipboardList,
  FileCheck2,
  Sparkles,
} from "lucide-react";

// 4 features that reflect what the product ACTUALLY does today.
// If we can't ship it in v1, it doesn't go here — no vaporware promises.
const features = [
  {
    icon: Briefcase,
    title: "H1B-friendly job search",
    description:
      "Real jobs from LinkedIn, Indeed, and company sites. Companies that actually sponsor H1B visas are ranked first — verified against USCIS filings.",
    iconBg: "bg-blue-100 text-blue-600",
  },
  {
    icon: FileCheck2,
    title: "Honest ATS scoring",
    description:
      "See exactly how your resume matches each job. No vanity numbers — a 40 means 40. We tell you where you fit and where you lack.",
    iconBg: "bg-indigo-100 text-indigo-600",
  },
  {
    icon: Sparkles,
    title: "Tailored per job, in one click",
    description:
      "Improve your resume for a specific role with a single click. Download in DOCX or PDF, ready to send.",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: ClipboardList,
    title: "Application tracker",
    description:
      "Every job you apply to, in one place. Track status, notes, and outcomes — no more scattered spreadsheets.",
    iconBg: "bg-amber-100 text-amber-600",
  },
];

export function Features() {
  return (
    <section id="features" className="px-6 py-12">
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeading
          eyebrow="What we do"
          title="Everything you need — nothing you don't."
          subtitle="Find jobs. Score them honestly. Tailor and apply. That's the loop."
        />

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
              >
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