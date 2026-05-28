import Link from "next/link";
import { BarChart3, CheckCircle2, Sparkles, Target } from "lucide-react";

export function MarketingHero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-12 md:pt-20">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -right-32 top-40 h-[420px] w-[420px] rounded-full bg-indigo-200/40 blur-3xl" />
      </div>
      <div className="mx-auto w-full max-w-7xl px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Career Intelligence - Beta
          </div>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Most tools stop at your resume.{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              We get you interview-ready.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 md:text-lg md:leading-8">
            AI checks your resume against any job, shows you why you'd get rejected, fixes it, and preps you for the interview — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="font-medium">AI-Powered Insights</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-600" />
              <span className="font-medium">Personalized Guidance</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">Beta Access - Free</span>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/app"
              className="rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-md md:text-base"
            >
              Try Beta Free
            </Link>
            <a
               href="#features"
              className="rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 md:text-base"
            >
              See Features
            </a>
          </div>
          <p className="mt-5 text-xs text-slate-400">
            Free during beta. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}