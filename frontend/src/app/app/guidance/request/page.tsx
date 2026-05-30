"use client";

import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Mail,
  Repeat,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { LockedFeaturePage } from "@/components/layout/LockedFeaturePage";

// 1-on-1 Guidance request form (/app/guidance/request).
// Three render states:
//   1. Not loaded yet (Clerk hasn't told us auth state) → null
//   2. Anonymous → LockedFeaturePage
//   3. Signed-in → Form, then SuccessState after submit
//
// On submit, POSTs to /api/guidance which saves to Supabase and fires emails.
// We don't navigate away on success — we replace the form with a success
// screen showing their reference number. Less disorienting than a redirect.

type SessionLength = "30min" | "60min";
type CurrentStatus = "student" | "job_seeker" | "career_switcher";

interface FormState {
  fullName: string;
  email: string;
  sessionLength: SessionLength;
  technology: string;
  currentStatus: CurrentStatus;
  goal: string;
  preferredTimes: string;
  linkedinUrl: string;
}

export default function GuidanceRequestPage() {
  const { isSignedIn, isLoaded, user } = useUser();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <LockedFeaturePage
        icon={Users}
        tileColor="pink"
        title="Request a 1-on-1 Session"
        description="Sign up to book a session with a real working engineer. $29 for 30 min, $49 for 60 min."
        features={[
          "Direct access to working engineers",
          "Resume + portfolio review tailored to you",
          "Coordinated within 48 hours of your request",
        ]}
        ctaText="Sign up free"
        ctaHref="/sign-up"
        secondaryText="Already have an account? Sign in"
        secondaryHref="/sign-in"
      />
    );
  }

  return <RequestForm clerkName={user?.fullName} clerkEmail={user?.emailAddresses[0]?.emailAddress} />;
}

function RequestForm({
  clerkName,
  clerkEmail,
}: {
  clerkName: string | null | undefined;
  clerkEmail: string | undefined;
}) {
  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    sessionLength: "30min",
    technology: "",
    currentStatus: "job_seeker",
    goal: "",
    preferredTimes: "",
    linkedinUrl: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);

  // Prefill name + email from Clerk on first mount.
  // Wrapped in an effect so we only set initial values once, not on every render.
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || clerkName || "",
      email: prev.email || clerkEmail || "",
    }));
  }, [clerkName, clerkEmail]);

  // Field-level helpers — keep onChange handlers tiny in the JSX
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit =
    !submitting &&
    form.fullName.trim().length >= 2 &&
    form.email.trim().length >= 5 &&
    form.technology.trim().length >= 2 &&
    form.goal.trim().length >= 10 &&
    form.preferredTimes.trim().length >= 5;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          sessionLength: form.sessionLength,
          technology: form.technology,
          currentStatus: form.currentStatus,
          goal: form.goal,
          preferredTimes: form.preferredTimes,
          linkedinUrl: form.linkedinUrl || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }
      const data = (await res.json()) as { ok: boolean; referenceNumber: string };
      setReferenceNumber(data.referenceNumber);
    } catch (err) {
      console.error(err);
      setError(
        "Something went wrong submitting your request. Please try again, or email us directly if it keeps failing.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Success state replaces the entire form when we have a reference number.
  if (referenceNumber) {
    return <SuccessState referenceNumber={referenceNumber} email={form.email} />;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-10">
      <BackLink />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 md:text-xl">
              Request a Session
            </h1>
            <p className="text-xs text-slate-500 md:text-sm">
              We&apos;ll match you with a mentor within 48 hours
            </p>
          </div>
        </div>

        {/* Session length */}
        <SectionLabel text="Session length" required />
        <div className="mb-6 grid gap-3 md:grid-cols-2">
          <SessionTile
            length="30min"
            price="$29"
            label="30 minutes"
            sub="Focused conversation"
            selected={form.sessionLength === "30min"}
            onSelect={() => update("sessionLength", "30min")}
          />
          <SessionTile
            length="60min"
            price="$49"
            label="60 minutes"
            sub="Deep dive · most popular"
            selected={form.sessionLength === "60min"}
            onSelect={() => update("sessionLength", "60min")}
          />
        </div>

        {/* Name */}
        <div className="mb-4">
          <SectionLabel text="Your name" required />
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            placeholder="Vishnu Teja"
            className={inputClasses}
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <SectionLabel text="Email" required />
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="you@example.com"
            className={inputClasses}
          />
          <p className="mt-1 text-xs text-slate-500">
            We&apos;ll send your match details and payment link here.
          </p>
        </div>

        {/* Technology / focus */}
        <div className="mb-4">
          <SectionLabel text="What technology or role do you want help with?" required />
          <input
            type="text"
            value={form.technology}
            onChange={(e) => update("technology", e.target.value)}
            placeholder="e.g. React frontend, Data Science, FAANG system design"
            className={inputClasses}
          />
        </div>

        {/* Current status */}
        <div className="mb-4">
          <SectionLabel text="Where are you now?" required />
          <div className="grid gap-2 md:grid-cols-3">
            <StatusTile
              status="student"
              label="Student"
              icon={GraduationCap}
              selected={form.currentStatus === "student"}
              onSelect={() => update("currentStatus", "student")}
            />
            <StatusTile
              status="job_seeker"
              label="Job seeker"
              icon={Briefcase}
              selected={form.currentStatus === "job_seeker"}
              onSelect={() => update("currentStatus", "job_seeker")}
            />
            <StatusTile
              status="career_switcher"
              label="Switching careers"
              icon={Repeat}
              selected={form.currentStatus === "career_switcher"}
              onSelect={() => update("currentStatus", "career_switcher")}
            />
          </div>
        </div>

        {/* Goal */}
        <div className="mb-4">
          <SectionLabel text="What specifically do you want help with?" required />
          <textarea
            value={form.goal}
            onChange={(e) => update("goal", e.target.value)}
            placeholder="e.g. I have a Meta frontend interview next Wednesday and want to do 1 mock + system design review."
            rows={5}
            className={`${inputClasses} resize-y`}
          />
          <p className="mt-1 text-xs text-slate-500">
            The more specific, the better we can match you with the right mentor.
          </p>
        </div>

        {/* Preferred times */}
        <div className="mb-4">
          <SectionLabel text="When are you available?" required />
          <input
            type="text"
            value={form.preferredTimes}
            onChange={(e) => update("preferredTimes", e.target.value)}
            placeholder="e.g. Weekday evenings IST, especially Mon/Tue/Wed"
            className={inputClasses}
          />
        </div>

        {/* LinkedIn (optional) */}
        <div className="mb-6">
          <SectionLabel text="LinkedIn or portfolio URL (optional)" />
          <input
            type="url"
            value={form.linkedinUrl}
            onChange={(e) => update("linkedinUrl", e.target.value)}
            placeholder="https://linkedin.com/in/you"
            className={inputClasses}
          />
          <p className="mt-1 text-xs text-slate-500">
            Helps your mentor prep before the call.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-rose-600/20 transition hover:bg-rose-700 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Submitting…</span>
            </>
          ) : (
            <span>Submit Request</span>
          )}
        </button>

        <p className="mt-3 text-center text-xs text-slate-500">
          No payment yet — we&apos;ll send you a secure payment link once we
          match you with a mentor.
        </p>
      </div>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────

function BackLink() {
  return (
    <Link
      href="/app/guidance"
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
    >
      <ArrowLeft className="h-4 w-4" />
      <span>Back to overview</span>
    </Link>
  );
}

function SectionLabel({
  text,
  required = false,
}: {
  text: string;
  required?: boolean;
}) {
  return (
    <label className="mb-2 block text-sm font-medium text-slate-700">
      {text}
      {required && <span className="ml-0.5 text-rose-500">*</span>}
    </label>
  );
}

function SessionTile({
  length,
  price,
  label,
  sub,
  selected,
  onSelect,
}: {
  length: SessionLength;
  price: string;
  label: string;
  sub: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
        selected
          ? "border-rose-300 bg-rose-50 ring-2 ring-rose-100"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div>
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        <div className="text-xs text-slate-500">{sub}</div>
      </div>
      <div className={`text-lg font-semibold ${selected ? "text-rose-700" : "text-slate-700"}`}>
        {price}
      </div>
    </button>
  );
}

function StatusTile({
  label,
  icon: Icon,
  selected,
  onSelect,
}: {
  status: CurrentStatus;
  label: string;
  icon: typeof GraduationCap;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${
        selected
          ? "border-rose-300 bg-rose-50 text-rose-700 ring-1 ring-rose-200"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="font-medium">{label}</span>
    </button>
  );
}

function SuccessState({
  referenceNumber,
  email,
}: {
  referenceNumber: string;
  email: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center md:p-10">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
          Request received
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Thanks for requesting a 1-on-1 session. We&apos;ll match you with a
          mentor and email you within 48 hours.
        </p>

        <div className="mx-auto mt-6 max-w-md rounded-xl bg-slate-50 p-4 text-left">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Confirmation sent to
              </p>
              <p className="mt-0.5 text-sm font-medium text-slate-900">{email}</p>
              <p className="mt-2 text-xs text-slate-500">
                Reference: <span className="font-mono font-semibold text-slate-700">{referenceNumber}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Quote this number in any follow-up emails.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/app"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Analyze
          </Link>
          <Link
            href="/app/guidance"
            className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            View guidance options
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────
const inputClasses =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100";