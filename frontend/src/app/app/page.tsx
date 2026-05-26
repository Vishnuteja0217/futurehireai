"use client";

import { useState } from "react";

import { AnalysisResults } from "@/components/analysis/AnalysisResults";
import { Hero } from "@/components/landing/Hero";
import { AppNavbar } from "@/components/landing/AppNavbar";
import { FeedbackButton } from "@/components/landing/FeedbackButton";
import { AtsModal } from "@/components/modals/AtsModal";
import { JDModal } from "@/components/modals/JDModal";

// The /app route — the actual product.
export default function AppPage() {
  const [jdOpen, setJdOpen] = useState(false);
  const [atsOpen, setAtsOpen] = useState(false);

  return (
    <>
      <AppNavbar />

      <main>
        <Hero
          onShowJD={() => setJdOpen(true)}
          onShowAts={() => setAtsOpen(true)}
        />

        <AnalysisResults />
      </main>

      <FeedbackButton />

      <JDModal open={jdOpen} onClose={() => setJdOpen(false)} />
      <AtsModal open={atsOpen} onClose={() => setAtsOpen(false)} />
    </>
  );
}