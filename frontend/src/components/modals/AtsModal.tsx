"use client";

import { useResumeAnalysis } from "@/contexts/ResumeAnalysisContext";
import { Modal } from "./Modal";

export function AtsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { initialAtsScore, initialAtsReasoning } = useResumeAnalysis();

 // Defensive normalization: backend sometimes returns string or null instead of array.
  // Cast through `unknown` because the type says string[] but real data can vary.
  const raw = initialAtsReasoning as unknown;
  const reasoningList: string[] = Array.isArray(raw)
    ? raw
    : typeof raw === "string" && raw.trim()
      ? [raw]
      : [];

  return (
    <Modal open={open} onClose={onClose} title="Why This ATS Score?">
      <div className="mb-6 flex items-baseline gap-2">
        <span className="text-5xl font-bold text-blue-600">
          {initialAtsScore ?? "—"}
        </span>
        <span className="text-2xl font-semibold text-slate-400">%</span>
      </div>

      <div className="space-y-3">
        {reasoningList.length === 0 ? (
          <p className="text-sm text-slate-500">No reasoning provided yet.</p>
        ) : (
          reasoningList.map((item, i) => (
            <p key={i} className="text-sm leading-7 text-slate-700">
              • {item}
            </p>
          ))
        )}
      </div>
    </Modal>
  );
}