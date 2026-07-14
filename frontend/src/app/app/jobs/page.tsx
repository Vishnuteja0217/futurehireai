"use client";

import { useUser } from "@clerk/nextjs";
import {
  Briefcase,
  Building2,
  ExternalLink,
  FileUp,
  Loader2,
  MapPin,
  Search,
  Shield,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { LockedFeaturePage } from "@/components/layout/LockedFeaturePage";
import { searchJobs, uploadResume } from "@/lib/api";
import type { Job, JobSearchResponse } from "@/lib/types";

// Session storage keys — kept as constants so refactors don't drift
const SS_KEYS = {
  resumeText: "fh_resume_text",
  resumeFileName: "fh_resume_filename",
  jobs: "fh_jobs_results",
  role: "fh_search_role",
  location: "fh_search_location",
} as const;

// Safe read/write — sessionStorage doesn't exist during SSR, and JSON.parse
// can throw on corrupted values. Wrap both so a bad cache doesn't crash the page.
function readSS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeSS(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded / private mode — silently skip. UX degrades to
    // "detail page won't remember jobs" which is survivable.
  }
}

function clearSS(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// localStorage variants — used for resume text which needs to persist
// across tabs. localStorage survives new tabs, refreshes, and browser
// restarts. sessionStorage does not.
function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota/private mode
  }
}

function clearLS(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// /app/jobs — job discovery with H1B sponsor ranking.
//
// V1 scope (this file):
//   - Search form: role + location + submit
//   - Wire to /search-jobs backend
//   - Loading, empty, error, and results states
//   - JobCard list — H1B sponsors ranked first (backend does the sort)
//
// Deferred (next iterations):
//   - Job detail modal drawer
//   - Right rail (Tailor / Cover Letter / Save)
//   - Filter sidebar (salary, remote, seniority)
//   - Tracker integration (Save button on card)
//   - Anonymous access with locked H1B badge

export default function JobsPage() {
  const { isSignedIn, isLoaded } = useUser();

  // Resume state — browser session, survives navigation via sessionStorage.
  // We hydrate lazily so the initial render doesn't touch window on SSR.
  const [resumeText, setResumeText] = useState<string | null>(() =>
    readLS<string | null>(SS_KEYS.resumeText, null),
  );
  const [resumeFileName, setResumeFileName] = useState<string | null>(() =>
    readLS<string | null>(SS_KEYS.resumeFileName, null),
  );
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  // Search form state — also restored so refresh keeps the last search
  const [role, setRole] = useState(() => readSS<string>(SS_KEYS.role, ""));
  const [location, setLocation] = useState(() =>
    readSS<string>(SS_KEYS.location, ""),
  );
  // Sort order — "h1b" default (keeps H1B priority), "latest" (newest first regardless)
  const [sortBy, setSortBy] = useState<"h1b" | "latest">("h1b");

  // Results state — restored so the detail page → back button keeps the list
  const [results, setResults] = useState<JobSearchResponse | null>(() =>
    readSS<JobSearchResponse | null>(SS_KEYS.jobs, null),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoaded) return null;

  // Anonymous users — locked feature page.
  // We'll unlock partial browsing in a future iteration.
  if (!isSignedIn) {
    return (
      <LockedFeaturePage
        icon={Briefcase}
        tileColor="blue"
        title="Job Discovery"
        description="Browse jobs from real employers. Companies with H1B sponsorship history ranked first — data straight from USCIS."
        features={[
          "Real jobs from LinkedIn, Indeed, Glassdoor",
          "H1B sponsor history from USCIS FY2025 filings",
          "Sponsors ranked first automatically",
          "Tailor your resume for any job in one click",
        ]}
        ctaText="Sign up free"
        ctaHref="/sign-up"
        secondaryText="Already have an account? Sign in"
        secondaryHref="/sign-in"
      />
    );
  }

async function handleResumeUpload(file: File) {
    setResumeError(null);
    setResumeUploading(true);
    try {
      const { resume_text } = await uploadResume(file);
      setResumeText(resume_text);
      setResumeFileName(file.name);
      writeLS(SS_KEYS.resumeText, resume_text);
      writeLS(SS_KEYS.resumeFileName, file.name);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setResumeError(message);
    } finally {
      setResumeUploading(false);
    }
  }

  function handleResumeRemove() {
    setResumeText(null);
    setResumeFileName(null);
    setResumeError(null);
    clearLS(SS_KEYS.resumeText);
    clearLS(SS_KEYS.resumeFileName);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!role.trim()) {
      setError("Please enter a role to search.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const data = await searchJobs(role.trim(), location.trim());
      if (data.error) {
        setError(data.error);
      } else {
        setResults(data);
        // Persist so refresh + navigation back from detail page keeps the list
        writeSS(SS_KEYS.jobs, data);
        writeSS(SS_KEYS.role, role.trim());
        writeSS(SS_KEYS.location, location.trim());
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Page header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <Briefcase className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Jobs</h1>
          <p className="text-xs text-slate-500">
            H1B-friendly companies ranked first — from real USCIS data.
          </p>
        </div>
      </div>

      {/* Resume strip — upload prompt when empty, status when uploaded */}
      <ResumeStrip
        fileName={resumeFileName}
        uploading={resumeUploading}
        error={resumeError}
        onUpload={handleResumeUpload}
        onRemove={handleResumeRemove}
      />

      {/* Search form */}
      <form
        onSubmit={handleSearch}
        className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          {/* Role */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Software Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none ring-blue-500 focus:border-blue-500 focus:ring-1"
              disabled={loading}
            />
          </div>

          {/* Location */}
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Location (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none ring-blue-500 focus:border-blue-500 focus:ring-1"
              disabled={loading}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Search
          </button>
        </div>

        <p className="mt-3 text-[11px] text-slate-400">
          Data from USCIS FY2025 LCA filings. 62,983 sponsor companies indexed.
        </p>
      </form>

      {/* Error state */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Content states */}
      {loading && <LoadingState />}
      {!loading && !results && !error && <EmptyState />}
      {!loading && results && (
        <ResultsList results={results} sortBy={sortBy} onSortChange={setSortBy} />
      )}
    </div>
  );
}

// ── Empty state (no search yet) ────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
        <Sparkles className="h-7 w-7 text-blue-500" />
      </div>
      <h2 className="text-base font-semibold text-slate-800">
        Search jobs to get started
      </h2>
      <p className="mt-1 max-w-xs text-sm text-slate-500">
        Enter a role and optional location. We&apos;ll show H1B-sponsoring
        companies first.
      </p>
    </div>
  );
}

// ── Loading state (during search) ─────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      <p className="mt-3 text-sm text-slate-500">Searching jobs…</p>
    </div>
  );
}

// ── Results header + list ─────────────────────────────────────────────────────

function ResultsList({
  results,
  sortBy,
  onSortChange,
}: {
  results: JobSearchResponse;
  sortBy: "h1b" | "latest";
  onSortChange: (v: "h1b" | "latest") => void;
}) {
  const { jobs, total_returned, h1b_sponsors_count, cached } = results;

  // Client-side sort based on user's dropdown choice
  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === "latest") {
      // Newest first regardless of H1B
      return (new Date(b.posted_at).getTime() || 0) - (new Date(a.posted_at).getTime() || 0);
    }
    // "h1b" — backend already sorted this way, keep as-is
    return 0;
  });

  if (total_returned === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <p className="text-sm text-slate-500">
          No jobs found. Try broadening your search.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Summary row + sort dropdown */}
      <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
        <span>
          {total_returned} job{total_returned !== 1 ? "s" : ""} ·{" "}
          <span className="font-medium text-blue-700">
            {h1b_sponsors_count} H1B sponsor{h1b_sponsors_count !== 1 ? "s" : ""}
          </span>
        </span>
        <div className="flex items-center gap-3">
          {cached && <span className="text-slate-400">Cached</span>}
          <label className="flex items-center gap-1.5">
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as "h1b" | "latest")}
              className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="h1b">H1B sponsors first</option>
              <option value="latest">Newest first</option>
            </select>
          </label>
        </div>
      </div>

      <div className="space-y-3">
        {sortedJobs.map((job) => (
          <JobCard key={job.job_id} job={job} />
        ))}
      </div>
    </>
  );
}

// ── Individual job card ───────────────────────────────────────────────────────

function JobCard({ job }: { job: Job }) {
  const salary = formatSalary(job);
  const postedAgo = formatPostedAt(job.posted_at);

  return (   
      <Link
      href={`/app/jobs/${encodeURIComponent(job.job_id)}`}
      className={`group block rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
        job.h1b_sponsor
          ? "border-blue-200 hover:border-blue-300"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Company logo or initial */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
          {job.company_logo ? (
            // Using plain img is intentional — job logos come from many domains,
            // and Next/Image would require whitelisting every source.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={job.company_logo}
              alt=""
              className="h-full w-full object-contain"
            />
          ) : (
            <Building2 className="h-5 w-5 text-slate-400" />
          )}
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-slate-900 group-hover:text-blue-700">
                {job.title}
              </h3>
              <p className="mt-0.5 truncate text-sm text-slate-600">
                {job.company}
              </p>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-blue-600" />
          </div>

          {/* Meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location || "Location unspecified"}
            </span>
            {job.job_type && <span>· {job.job_type}</span>}
            {salary && <span>· {salary}</span>}
            {postedAgo && <span>· {postedAgo}</span>}
          </div>

          {/* Badges */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.h1b_sponsor ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">
                <Shield className="h-3 w-3" />
                H1B Sponsor · {formatFilings(job.h1b_filings_2025)} filings
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-inset ring-slate-100">
                No H1B history
              </span>
            )}
            {job.work_arrangement === "remote" && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100">
                Remote
              </span>
            )}
            {job.work_arrangement === "hybrid" && (
              <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-700 ring-1 ring-inset ring-purple-100">
                Hybrid
              </span>
            )}
            {job.work_arrangement === "onsite" && (
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                Onsite
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSalary(job: Job): string | null {
  const { salary_min, salary_max, salary_period } = job;
  if (!salary_min && !salary_max) return null;

  const fmt = (n: number) => {
    if (n >= 1000) return `$${Math.round(n / 1000)}K`;
    return `$${n}`;
  };

  const range =
    salary_min && salary_max
      ? `${fmt(salary_min)}–${fmt(salary_max)}`
      : fmt((salary_min ?? salary_max) as number);

  const suffix =
    salary_period === "YEAR"
      ? "/yr"
      : salary_period === "HOUR"
      ? "/hr"
      : "";

  return `${range}${suffix}`;
}

function formatPostedAt(iso: string): string | null {
  if (!iso) return null;
  const posted = new Date(iso);
  if (isNaN(posted.getTime())) return null;

  const now = Date.now();
  const diffMs = now - posted.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function formatFilings(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

// ── Resume strip (shown above search) ─────────────────────────────────────────

function ResumeStrip({
  fileName,
  uploading,
  error,
  onUpload,
  onRemove,
}: {
  fileName: string | null;
  uploading: boolean;
  error: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    // Reset so uploading the same file twice still triggers change
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // No resume yet — upload prompt
  if (!fileName) {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
            <FileUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Upload your resume to unlock ATS matching
            </p>
            <p className="text-xs text-slate-600">
              We&apos;ll show a match score against every job and let you
              tailor your resume for any of them.
            </p>
            {error && (
              <p className="mt-1 text-xs text-red-600">{error}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={openFilePicker}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileUp className="h-4 w-4" />
          )}
          {uploading ? "Uploading…" : "Upload resume"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  // Resume uploaded — status strip
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          ✓
        </span>
        <span className="font-medium text-slate-900">Resume:</span>
        <span className="truncate text-slate-700">{fileName}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={openFilePicker}
          disabled={uploading}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {uploading ? "Uploading…" : "Replace"}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-3 w-3" />
          Remove
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}