"use client";

import { useState } from "react";

import { AnalysisResults } from "@/components/analysis/AnalysisResults";
import { ComingSoon } from "@/components/landing/ComingSoon";
import { CTA } from "@/components/landing/CTA";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Navbar } from "@/components/landing/Navbar";
import { Stats } from "@/components/landing/Stats";
import { AtsModal } from "@/components/modals/AtsModal";
import { JDModal } from "@/components/modals/JDModal";
import { ResumeAnalysisProvider } from "@/contexts/ResumeAnalysisContext";

// page.tsx is now just composition — every section is its own file.
// Modal open/close state is local to the page because it doesn't need
// to be shared with anything outside the upload flow.
export default function Home() {
  const [jdOpen, setJdOpen] = useState(false);
  const [atsOpen, setAtsOpen] = useState(false);

  return (
    <ResumeAnalysisProvider>
      <Navbar />

      <main>
        <Hero
          onShowJD={() => setJdOpen(true)}
          onShowAts={() => setAtsOpen(true)}
        />

        {/* Renders only after a successful analysis */}
        <AnalysisResults />

        <Stats />
        <Features />
        <HowItWorks />
        <ComingSoon />
        <CTA />
      </main>

      <Footer />

      <JDModal open={jdOpen} onClose={() => setJdOpen(false)} />
      <AtsModal open={atsOpen} onClose={() => setAtsOpen(false)} />
    </ResumeAnalysisProvider>
  );
}
