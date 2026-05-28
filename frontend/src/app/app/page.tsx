"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";

import { AnalysisResults } from "@/components/analysis/AnalysisResults";
import { AppNavbar } from "@/components/landing/AppNavbar";
import { FeedbackButton } from "@/components/landing/FeedbackButton";
import { Hero } from "@/components/landing/Hero";
import { AtsModal } from "@/components/modals/AtsModal";
import { JDModal } from "@/components/modals/JDModal";
import { LimitModal } from "@/components/modals/LimitModal";

// The /app route — the actual product.
export default function AppPage() {
  const [jdOpen, setJdOpen] = useState(false);
  const [atsOpen, setAtsOpen] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);

  const { isSignedIn } = useUser();

  return (
    <>
      <AppNavbar />

      <main>
        <Hero
          onShowJD={() => setJdOpen(true)}
          onShowAts={() => setAtsOpen(true)}
          onShowLimit={() => setLimitOpen(true)}
        />

        <AnalysisResults />
      </main>

      <FeedbackButton />

      <JDModal open={jdOpen} onClose={() => setJdOpen(false)} />
      <AtsModal open={atsOpen} onClose={() => setAtsOpen(false)} />
      <LimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        kind={isSignedIn ? "signed-in" : "anonymous"}
      />
    </>
  );
}