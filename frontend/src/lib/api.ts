// All API calls live here. UI components never fetch directly.
// Makes it easy to swap endpoints, add error handling, retry logic, or
// move to a real client (React Query, SWR) later.

import { API_BASE_URL } from "./constants";
import type {
  AnswerFeedback,
  CompareResumeResponse,
  JobSearchResponse,
  TailoredResume,
} from "./types";

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed with ${res.status}`);
  }
  return res.json();
}

export async function uploadResume(file: File): Promise<{ resume_text: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/upload-resume`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Resume upload failed with ${res.status}`);
  return res.json();
}

export function extractJDFromUrl(url: string) {
  return postJSON<{ job_description?: string }>("/extract-jd-from-url", { url });
}

export function compareResumeJD(resume_text: string, job_description: string) {
  return postJSON<CompareResumeResponse>("/compare-resume-jd", {
    resume_text,
    job_description,
  });
}

export function evaluateAnswer(
  question: string,
  answer: string,
  job_description: string,
) {
  return postJSON<AnswerFeedback>("/evaluate-answer", {
    question,
    answer,
    job_description,
  });
}

export function generateTailoredResume(
  resume_text: string,
  job_description: string,
  confirmed_skills: string[] = [],
) {
  return postJSON<TailoredResume>("/generate-tailored-resume", {
    resume_text,
    job_description,
    confirmed_skills,
  });
}

/**
 * Returns tools the JD mentions that aren't on the resume.
 * Used to ask the candidate "have you actually used these?" before
 * tailoring, so we can honestly add real experience they forgot to list.
 */
export function detectMissingSkills(
  resume_text: string,
  job_description: string,
) {
  return postJSON<{ missing_skills: string[] }>("/detect-missing-skills", {
    resume_text,
    job_description,
  });
}

export function generateCoverLetter(
  resume_text: string,
  job_description: string,
) {
  return postJSON<{ cover_letter: string }>("/generate-cover-letter", {
    resume_text,
    job_description,
  });
}

/**
 * Triggers a browser download for a generated resume.
 * Keeps blob-handling out of components.
 */
export async function downloadTailoredResume(
  format: "docx" | "pdf",
  tailored_resume: string,
) {
  const endpoint =
    format === "docx"
      ? "/download-tailored-resume-docx"
      : "/download-tailored-resume-pdf";

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tailored_resume }),
  });

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tailored_resume.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Triggers a browser download for a generated cover letter.
 */
export async function downloadCoverLetter(
  format: "docx" | "pdf",
  cover_letter: string,
) {
  const endpoint =
    format === "docx"
      ? "/download-cover-letter-docx"
      : "/download-cover-letter-pdf";

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cover_letter }),
  });

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cover_letter.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Search for jobs and enrich with H1B sponsor data.
 * Backend hits JSearch (RapidAPI), looks up each employer in the USCIS
 * H1B sponsor JSON, and returns jobs with H1B sponsors ranked first.
 *
 * Cached for 24h in Supabase — same (role + location + experience_level)
 * within 24h returns instantly with cached: true.
 */
export function searchJobs(
  role: string,
  location: string = "",
  experience_level: string = "",
) {
  return postJSON<JobSearchResponse>("/search-jobs", {
    role,
    location,
    experience_level,
  });
}