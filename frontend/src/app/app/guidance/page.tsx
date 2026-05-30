"use client";

import { useUser } from "@clerk/nextjs";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

import { LockedFeaturePage } from "@/components/layout/LockedFeaturePage";

// 1-on-1 Career Guidance — info/marketing page.
// Anonymous: LockedFeaturePage (conversion CTA → /sign-up)
// Signed-in: pricing tiles + "what you get" + "Request a Session" CTA → /app/guidance/request
//
// The form itself lives at /app/guidance/request to keep concerns separate:
// this page sells the service, that page collects the request.
export default function GuidancePage() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <LockedFeaturePage
        icon={Users}
        tileColor="pink"
        title="1-on-1 Career Guidance"
        description="Talk to a real working engineer about your career. Resume review, interview prep, technology guidance — tailored to where you are."
        features={[
          "Sessions with real engineers and tech leads",
          "Resume + portfolio review tailored to your goals",
          "$29 for 30 min · $49 for 60 min",
        ]}
        ctaText="Sign up to request a session"
        ctaHref="/sign-up"
        secondaryText="Already have an account? Sign in"
        secondaryHref="/sign-in"
      />
    );
  }

  return <GuidanceInfo />;
}

function GuidanceInfo() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">
      {/* Hero */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              1-on-1 Career Guidance
            </h1>
            <p className="text-sm text-slate-500">
              Talk to a real engineer about your career
            </p>
          </div>
        </div>
        <p className="text-sm leading-7 text-slate-700 md:text-[15px]">
          Book a private session with a working tech professional. Get real
          advice on resumes, interviews, system design, technology choices, or
          career transitions — from someone who&apos;s been in your seat and is
          in the industry right now.
        </p>
      </div>

      {/* Pricing tiles */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Session options
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* 30 min */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              <span>30 minutes</span>
            </div>
            <div className="mb-1 text-3xl font-semibold text-slate-900">
              $29
            </div>
            <div className="mb-4 text-sm text-slate-600">
              Focused conversation
            </div>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>One specific question or topic</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>Quick resume or portfolio review</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>Practical, no-fluff advice</span>
              </li>
            </ul>
          </div>

          {/* 60 min — recommended */}
          <div className="relative rounded-2xl border-2 border-rose-200 bg-rose-50/30 p-5">
            <span className="absolute -top-2 left-5 rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
              Most popular
            </span>
            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              <span>60 minutes</span>
            </div>
            <div className="mb-1 text-3xl font-semibold text-slate-900">
              $49
            </div>
            <div className="mb-4 text-sm text-slate-600">Deep dive</div>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>Mock interview + feedback</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>System design or technical walkthrough</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>Career path planning + goals</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          How it works
        </h2>
        <ol className="space-y-4">
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-semibold text-rose-700">
              1
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Tell us what you need
              </p>
              <p className="text-sm leading-6 text-slate-600">
                Fill out a short form: technology, role, what you want help
                with, and when you&apos;re available.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-semibold text-rose-700">
              2
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                We match you with a mentor
              </p>
              <p className="text-sm leading-6 text-slate-600">
                Within 48 hours (usually much sooner), you&apos;ll receive an
                email with your mentor&apos;s details and a secure payment link.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-semibold text-rose-700">
              3
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Pay and book
              </p>
              <p className="text-sm leading-6 text-slate-600">
                Pay via Stripe, pick a time that works for both of you, and
                we&apos;ll send the calendar invite + video meeting link.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-semibold text-rose-700">
              4
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Have the call
              </p>
              <p className="text-sm leading-6 text-slate-600">
                Show up, ask questions, learn. We&apos;ll follow up afterward
                to make sure it was useful.
              </p>
            </div>
          </li>
        </ol>
      </div>

      {/* CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 p-6 text-center md:p-8">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 md:text-xl">
          Ready to talk to someone?
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Tell us what you need help with and we&apos;ll match you with the
          right mentor. Most matches happen within 24 hours.
        </p>
        <Link
          href="/app/guidance/request"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-rose-600/20 transition hover:bg-rose-700 hover:shadow-md"
        >
          <Calendar className="h-4 w-4" />
          <span>Request a Session</span>
        </Link>
        <p className="mt-3 text-xs text-slate-500">
          We&apos;ll get back to you within 48 hours
        </p>
      </div>
    </div>
  );
}