"use client";

import { useResumeAnalysis } from "@/contexts/ResumeAnalysisContext";
import { Modal } from "./Modal";

export function JDModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { jobDescription } = useResumeAnalysis();

  return (
    <Modal open={open} onClose={onClose} title="Full Job Description">
      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
        {jobDescription || "No job description pasted yet."}
      </p>
    </Modal>
  );
}
