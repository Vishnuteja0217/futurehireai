import Link from "next/link";
import { Briefcase, FileCheck2, Sparkles, ClipboardList } from "lucide-react";

export function MarketingHero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-16 md:pt-28">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -right-32 top-40 h-[420px] w-[420px] rounded-full bg-indigo-200/40 blur-3xl" />
      </div>
      <div className="mx-auto w-full max-w-7xl px-6">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge — mentions H1B data as the differentiator without gating on audience */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            H1B Sponsor Data · Honest ATS Scoring
          </div>

          {/* Headline: "Job search, done right." — the noun phrase carries the whole promise */}
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
            Job search,{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              done right.
            </span>
          </h1>

          {/* Subhead: three rhythmic promises, then the concrete features that back them up */}
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl md:leading-9">
            Right job. Right resume. Right time.
            <br />
            H1B sponsor data + honest ATS scoring, in one place.
          </p>

          {/* Trust-marker row — swaps the old generic claims for the actual product surface */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-600" />
              <span className="font-medium">62,983 sponsor companies</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-indigo-600" />
              <span className="font-medium">Real ATS scores</span>
            </div>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">Every application, tracked</span>
            </div>
          </div>

          {/* Authority line — cites data source without cluttering the trust markers above */}
          <p className="mt-3 text-xs text-slate-500">
            Real USCIS data. 62,983 sponsoring companies from LCA filings.
          </p>

          {/* CTAs — primary sends to /app/jobs (where the value lives), secondary anchors to features */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/app/jobs"
              className="rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-md md:text-lg"
            >
              Browse jobs
            </Link>
            <a
              href="#how-it-works"
              className="rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 md:text-lg"
            >
              See how it works
            </a>
          </div>

          <p className="mt-5 text-xs text-slate-400">
            Free to browse. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}