"use client";

import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Shield,
  Sparkles,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  compareResumeJD,
  downloadCoverLetter,
  downloadTailoredResume,
  generateCoverLetter,
  generateTailoredResume,
  getJobDetails,
} from "@/lib/api";
import type {
  CompareResumeResponse,
  Job,
  JobSearchResponse,
  TailoredResume,
} from "@/lib/types";

// /app/jobs/[job_id] — dedicated detail page for a single job.
//
// Data source (v1): jobs are read from sessionStorage, populated when the
// user searched on /app/jobs. If someone hits this URL cold (no search
// history), we show a "job not found" state that sends them back to search.
//
// Flow:
//   1. On mount, read job + resume text from sessionStorage
//   2. If resume exists, auto-call /compare-resume-jd for ATS score
//   3. Render ATS score → full JD → strengths → gaps → actions
//   4. Actions: Improve resume (opens tailoring), Cover letter, Apply (external)
//
// Deferred to v2:
//   - Fetch job by id from backend (currently sessionStorage-only)
//   - Persist ATS score cache per (resume, job) pair
//   - Skill confirmation modal (using it standalone is complex here — v2)

const SS_KEYS = {
  resumeText: "fh_resume_text",
  jobs: "fh_jobs_results",
} as const;

function readSS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}


export default function JobDetailPage() {
  const { isSignedIn, isLoaded } = useUser();
  const params = useParams<{ job_id: string }>();
  const router = useRouter();

  // The job_id from the URL comes URL-encoded — decode so we can match it
  // against the id we stored during search.
  const jobId = decodeURIComponent(params?.job_id ?? "");

  // Resolved state pulled from sessionStorage
  const [job, setJob] = useState<Job | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // ATS scoring state
  const [ats, setAts] = useState<CompareResumeResponse | null>(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsError, setAtsError] = useState<string | null>(null);

  // Tailored resume + cover letter state (triggered by action buttons)
  const [tailored, setTailored] = useState<TailoredResume | null>(null);
  const [tailoringLoading, setTailoringLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [coverLoading, setCoverLoading] = useState(false);

  // Modal state: which "View" was clicked — 'tailored' | 'cover' | null
  const [openModal, setOpenModal] = useState<null | "tailored" | "cover">(null);

  // Hydrate from sessionStorage first, fall back to backend fetch.
  // This lets people open jobs in new tabs / share URLs without breaking.
  useEffect(() => {
    (async () => {
      const savedResume = readLS<string | null>(SS_KEYS.resumeText, null);
      setResumeText(savedResume);

      // Try sessionStorage first (fast)
      const results = readSS<JobSearchResponse | null>(SS_KEYS.jobs, null);
      const foundJob = results?.jobs.find((j) => j.job_id === jobId) ?? null;

      if (foundJob) {
        setJob(foundJob);
        setHydrated(true);
        return;
      }

      // Fall back to backend fetch
      try {
        const { job: fetchedJob } = await getJobDetails(jobId);
        if (fetchedJob) {
          setJob(fetchedJob);
        }
      } catch {
        // If fetch fails, job stays null → "Job not found" UI renders
      } finally {
        setHydrated(true);
      }
    })();
  }, [jobId]);

  // Auto-calculate ATS as soon as we have both a job and a resume.
  // Tracks a "tried" flag so a failed call doesn't retry infinitely.
  const [atsTried, setAtsTried] = useState(false);

  useEffect(() => {
    if (!hydrated || !job || !resumeText || atsTried) return;
    if (!job.description_full || job.description_full.length < 50) {
      setAtsTried(true);
      setAtsError("Job description is missing — can't calculate ATS score.");
      return;
    }

    setAtsTried(true);
    setAtsLoading(true);
    setAtsError(null);

    (async () => {
      try {
        const data = await compareResumeJD(resumeText, job.description_full);
        setAts(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "ATS scoring failed.";
        setAtsError(message);
      } finally {
        setAtsLoading(false);
      }
    })();
  }, [hydrated, job, resumeText, atsTried]);

  if (!isLoaded || !hydrated) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isSignedIn) {
    // Same locked pattern as /app/jobs — signed-out users see the marketing pitch
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-slate-500">Please sign in to view this job.</p>
        <Link
          href="/sign-in"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  // Job not in sessionStorage (direct link, cache cleared, etc.)
  if (!job) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <Briefcase className="h-7 w-7 text-slate-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">Job not found</h2>
        <p className="mt-2 text-sm text-slate-500">
          We couldn&apos;t find this job in your recent searches. Try searching again.
        </p>
        <Link
          href="/app/jobs"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to jobs
        </Link>
      </div>
    );
  }

  async function handleImprove() {
    if (!resumeText || !job) return;
    setTailoringLoading(true);
    try {
      const data = await generateTailoredResume(resumeText, job.description_full, []);
      setTailored(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Tailoring failed.";
      setAtsError(message);
    } finally {
      setTailoringLoading(false);
    }
  }

  async function handleCoverLetter() {
    if (!resumeText || !job) return;
    setCoverLoading(true);
    try {
      const data = await generateCoverLetter(resumeText, job.description_full);
      setCoverLetter(data.cover_letter ?? "");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Cover letter failed.";
      setAtsError(message);
    } finally {
      setCoverLoading(false);
    }
  }

  const strengths = ats?.top_strengths ?? [];
  const gaps = [...(ats?.critical_gaps ?? []), ...(ats?.likely_rejection_reasons ?? [])];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Back link */}
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </button>

      {/* Job header — full width across both columns */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
            {job.company_logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={job.company_logo} alt="" className="h-full w-full object-contain" />
            ) : (
              <Building2 className="h-6 w-6 text-slate-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-slate-900">{job.title}</h1>
            <p className="mt-0.5 text-sm text-slate-600">{job.company}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {job.location || "Location unspecified"}
              </span>
              {job.job_type && <span>· {job.job_type}</span>}
              {job.posted_at && <span>· via {job.source}</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.h1b_sponsor && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">
                  <Shield className="h-3 w-3" />
                  H1B Sponsor · {job.h1b_filings_2025} filings
                </span>
              )}
              {job.is_remote && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100">
                  Remote
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout — JD on left, ATS + fit/lack + actions on right.
          The right column uses lg:sticky so it stays visible while the JD scrolls.
          On mobile (< lg breakpoint), columns stack. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">

        {/* LEFT column: Full JD */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
            <FileText className="h-4 w-4" />
            Job description
          </h2>
          <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {job.description_full}
          </div>
        </section>

        {/* RIGHT column: ATS score, actions, fit, lack */}
        <aside className="flex flex-col gap-3 lg:sticky lg:top-4 lg:self-start">
          {!resumeText ? (
            <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-4 text-center">
              <Sparkles className="mx-auto mb-2 h-5 w-5 text-blue-500" />
              <p className="text-xs font-semibold text-slate-900">
                Upload a resume to see ATS match.
              </p>
              <Link
                href="/app/jobs"
                className="mt-2 inline-block rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Go to jobs
              </Link>
            </div>
          ) : (
            <AtsCard ats={ats} loading={atsLoading} error={atsError} />
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            {(!ats?.initial_ats_score || ats.initial_ats_score < 85) && (
              <button
                type="button"
                onClick={handleImprove}
                disabled={!resumeText || tailoringLoading}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {tailoringLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Improve my resume
              </button>
            )}

            {ats?.initial_ats_score && ats.initial_ats_score >= 85 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-center">
                <p className="text-[11px] font-semibold text-emerald-800">
                  ✓ Strong match — no tailoring needed
                </p>
                <p className="mt-0.5 text-[10px] text-emerald-700">
                  Your resume already fits this role well. Apply as-is.
                </p>
              </div>
            )}

            {/* Compact result card — shows after Improve is clicked */}
            {tailored && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-emerald-800">
                      ✓ Tailored · ATS {tailored.projected_ats_score_after_tailoring}%
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenModal("tailored")}
                    className="shrink-0 rounded-md bg-white px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    View
                  </button>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      downloadTailoredResume("docx", tailored.tailored_resume)
                    }
                    className="flex-1 rounded-md border border-emerald-200 bg-white px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    DOCX
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      downloadTailoredResume("pdf", tailored.tailored_resume)
                    }
                    className="flex-1 rounded-md border border-emerald-200 bg-white px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    PDF
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleCoverLetter}
              disabled={!resumeText || coverLoading}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {coverLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Generate cover letter
            </button>

            {/* Compact result card — shows after cover letter is generated */}
            {coverLetter && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-emerald-800">
                    ✓ Cover letter ready
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpenModal("cover")}
                    className="shrink-0 rounded-md bg-white px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    View
                  </button>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => downloadCoverLetter("docx", coverLetter)}
                    className="flex-1 rounded-md border border-emerald-200 bg-white px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    DOCX
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadCoverLetter("pdf", coverLetter)}
                    className="flex-1 rounded-md border border-emerald-200 bg-white px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    PDF
                  </button>
                </div>
              </div>
            )}

            <a
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Apply on {job.source || "external"}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Where you fit */}
          {ats && strengths.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Where you fit
              </h3>
              <ul className="space-y-1.5">
                {strengths.map((s, i) => (
                  <li key={i} className="text-xs leading-snug text-slate-700">
                    · {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Where you lack */}
          {ats && gaps.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-red-700">
                <XCircle className="h-3.5 w-3.5" />
                Where you lack
              </h3>
              <ul className="space-y-1.5">
                {gaps.map((g, i) => (
                  <li key={i} className="text-xs leading-snug text-slate-700">
                    · {g}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {/* Modal — shows tailored resume or cover letter full text */}
      {openModal && (
        <ResultModal
          kind={openModal}
          tailored={tailored}
          coverLetter={coverLetter}
          onClose={() => setOpenModal(null)}
        />
      )}
    </div>
  );
}

// ── ResultModal — full-width view of tailored resume or cover letter ──────────
function ResultModal({
  kind,
  tailored,
  coverLetter,
  onClose,
}: {
  kind: "tailored" | "cover";
  tailored: TailoredResume | null;
  coverLetter: string | null;
  onClose: () => void;
}) {
  const isResume = kind === "tailored";
  const title = isResume ? "Tailored resume" : "Cover letter";
  const content = isResume ? tailored?.tailored_resume : coverLetter;
  const projectedScore = isResume ? tailored?.projected_ats_score_after_tailoring : null;

  if (!content) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {projectedScore != null && (
              <p className="mt-0.5 text-xs text-slate-500">
                Projected ATS after tailoring:{" "}
                <span className="font-semibold text-blue-700">{projectedScore}%</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-slate-800">
            {content}
          </pre>
        </div>

        {/* Footer with download buttons */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            onClick={() =>
              isResume
                ? downloadTailoredResume("docx", tailored!.tailored_resume)
                : downloadCoverLetter("docx", coverLetter!)
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Download DOCX
          </button>
          <button
            type="button"
            onClick={() =>
              isResume
                ? downloadTailoredResume("pdf", tailored!.tailored_resume)
                : downloadCoverLetter("pdf", coverLetter!)
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Download PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ATS score card ────────────────────────────────────────────────────────────

function AtsCard({
  ats,
  loading,
  error,
}: {
  ats: CompareResumeResponse | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        <span className="text-xs text-slate-500">Calculating ATS…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
        {error}
      </div>
    );
  }

  if (!ats?.initial_ats_score) return null;

  const score = ats.initial_ats_score;
  const tone =
    score >= 80
      ? { bg: "bg-emerald-50", text: "text-emerald-800", label: "Strong match" }
      : score >= 65
      ? { bg: "bg-blue-50", text: "text-blue-800", label: "Decent match" }
      : { bg: "bg-amber-50", text: "text-amber-800", label: "Weak match" };

  return (
    <div className={`rounded-2xl border border-slate-200 p-4 shadow-sm ${tone.bg}`}>
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
        ATS match
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className={`text-3xl font-bold ${tone.text}`}>{score}</span>
        <span className={`text-xs ${tone.text}`}>{tone.label}</span>
      </div>
    </div>
  );
}

  