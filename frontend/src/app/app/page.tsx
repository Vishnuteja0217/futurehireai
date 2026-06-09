"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";

import { AnalysisResults } from "@/components/analysis/AnalysisResults";
import { SkillConfirmationModal } from "@/components/analysis/SkillConfirmationModal";
import { Hero } from "@/components/landing/Hero";
import { AtsModal } from "@/components/modals/AtsModal";
import { JDModal } from "@/components/modals/JDModal";
import { LimitModal } from "@/components/modals/LimitModal";
import { useResumeAnalysis } from "@/contexts/ResumeAnalysisContext";

// The /app route — the Analyze page.
// AppNavbar and FeedbackButton are now provided by /app/layout.tsx,
// so this file only owns the page-specific content (Hero + results + modals).
export default function AppPage() {
  const [jdOpen, setJdOpen] = useState(false);
  const [atsOpen, setAtsOpen] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);

  const { isSignedIn } = useUser();

  // Read modal state from the resume-analysis flow.
  // The Context controls when this modal shows (between /detect-missing-skills
  // and /generate-tailored-resume).
  const {
    missingSkills,
    showSkillModal,
    closeSkillModal,
    confirmTailorWithSkills,
    tailoringLoading,
  } = useResumeAnalysis();

  return (
    <>
      <Hero
        onShowJD={() => setJdOpen(true)}
        onShowAts={() => setAtsOpen(true)}
        onShowLimit={() => setLimitOpen(true)}
      />

      <AnalysisResults />

      <JDModal open={jdOpen} onClose={() => setJdOpen(false)} />
      <AtsModal open={atsOpen} onClose={() => setAtsOpen(false)} />
      <LimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        kind={isSignedIn ? "signed-in" : "anonymous"}
      />

      {/* Skill confirmation flow — shown between detect-missing-skills
          and generate-tailored-resume. The Context decides when. */}
      {showSkillModal && (
        <SkillConfirmationModal
          missingSkills={missingSkills}
          onConfirm={confirmTailorWithSkills}
          onSkip={closeSkillModal}
          isLoading={tailoringLoading}
        />
      )}
    </>
  );
}