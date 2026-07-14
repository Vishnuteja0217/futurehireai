import { Analytics } from "@vercel/analytics/react";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "FutureHireAI — H1B sponsor jobs + honest ATS scoring",
  description:
    "Find jobs at companies that actually sponsor H1B visas. Real USCIS data on 62,983 sponsors. Honest ATS scoring against your resume. Job search, done right.",
  openGraph: {
    title: "FutureHireAI — H1B sponsor jobs + honest ATS scoring",
    description:
      "Find jobs at companies that actually sponsor H1B visas. Real USCIS data on 62,983 sponsors. Honest ATS scoring against your resume.",
    url: "https://futurehireai.com",
    siteName: "FutureHireAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FutureHireAI — H1B sponsor jobs + honest ATS scoring",
    description:
      "Find jobs at companies that actually sponsor H1B visas. Real USCIS data on 62,983 sponsors. Honest ATS scoring against your resume.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${jakarta.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-slate-50 font-sans text-slate-900">
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}