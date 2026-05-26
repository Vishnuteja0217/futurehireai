import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";

// Plus Jakarta Sans = clean, professional, slightly distinctive sans.
// Plays well with the SaaS aesthetic without feeling like default Inter.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

// Proper metadata. Replaces the "Create Next App" default that was killing
// the site's first impression in browser tabs and Google.
export const metadata: Metadata = {
  title: "FutureHireAI — Your AI Copilot for Career Growth",
  description:
    "Optimize your resume, prepare for interviews, improve ATS scores, and generate tailored career insights — all from one AI-powered platform.",
  keywords: [
    "AI resume",
    "ATS score",
    "interview prep",
    "resume tailoring",
    "career platform",
    "job application",
  ],
  authors: [{ name: "FutureHireAI" }],
  openGraph: {
    title: "FutureHireAI — Your AI Copilot for Career Growth",
    description:
      "AI-powered resume analysis, interview prep, and career insights.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FutureHireAI",
    description:
      "AI-powered resume analysis, interview prep, and career insights.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="bg-slate-50 font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
