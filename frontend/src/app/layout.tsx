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
  title: "FutureHireAI — Get Interview-Ready, Not Just Resume-Ready",
  description:
    "AI checks your resume against any job, shows you why you'd get rejected, fixes it, and preps you for the interview — all in one place.",
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