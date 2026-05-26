import type { AnalysisSection } from "@/lib/types";

// Renders one labelled list section (e.g. "Top Strengths").
// Returns null when there's nothing in the list so we don't show empty cards.
export function AnalysisCard({ section }: { section: AnalysisSection }) {
  if (!section.items || section.items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-slate-900">
        {section.title}
      </h3>

      <div className="space-y-3">
        {section.items.map((item, i) => (
          <p key={i} className="text-sm leading-6 text-slate-600">
            <span className="mr-2 text-blue-600">•</span>
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
