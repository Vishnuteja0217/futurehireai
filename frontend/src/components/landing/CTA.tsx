import { Sparkles } from "lucide-react";
import Link from "next/link";

export function CTA() {
  return (
    <section className="px-6 py-16">
      <div className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 px-8 py-12 md:px-12 md:py-14">
        {/* Subtle pattern overlay so it isn't a flat block of colour */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(255,255,255,.25) 0, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,.2) 0, transparent 50%)",
          }}
        />
        <Sparkles className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 text-white/10" />

        <div className="relative grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-2xl font-bold text-white md:text-3xl">
              Stop guessing what recruiters want.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-blue-100 md:text-base">
              Upload your resume and a job description — get an honest read in
              seconds. Free during beta.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

              <Link
              href="/app"
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              Try Beta Free
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              See Features
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
