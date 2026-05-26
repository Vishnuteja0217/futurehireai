// Centralized config so you don't hardcode URLs everywhere
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://futurehireai.onrender.com";

export const BRAND = {
  name: "FutureHireAI",
  tagline: "Your AI Copilot for Career Growth",
  description:
    "Optimize your resume, prepare for interviews, improve ATS scores, and generate tailored career insights — all from one intelligent platform.",
};
