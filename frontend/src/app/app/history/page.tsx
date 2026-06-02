"use client";

import { useUser } from "@clerk/nextjs";
import {
  ChartBar,
  Clock,
  FileText,
  Loader2,
  Mail,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useEffect, useState } from "react";

import { LockedFeaturePage } from "@/components/layout/LockedFeaturePage";
import {
  deleteHistoryEntry,
  loadHistory,
  type HistoryEntry,
  type HistoryFeature,
} from "@/lib/history";

// ── Feature config ────────────────────────────────────────────────────────────

const FEATURES: Record<
  HistoryFeature,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  analyze: {
    label: "Resume Analysis",
    icon: ChartBar,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  cover_letter: {
    label: "Cover Letter",
    icon: Mail,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  tailored_resume: {
    label: "Tailored Resume",
    icon: FileText,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  mock_interview: {
    label: "Mock Interview",
    icon: ChartBar,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
};

function featureMeta(feature: HistoryFeature) {
  return FEATURES[feature] ?? FEATURES["analyze"];
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({
  entry,
  onClose,
}: {
  entry: HistoryEntry;
  onClose: () => void;
}) {
  const meta = featureMeta(entry.feature);
  const Icon = meta.icon;
  const output = entry.output_data;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${meta.bg}`}>
              <Icon className={`h-4 w-4 ${meta.color}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{meta.label}</p>
              <p className="text-xs text-slate-400">
                {new Date(entry.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">

          {/* ATS Score */}
          {entry.ats_score != null && (
            <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3">
              <span className="text-2xl font-bold text-blue-700">{entry.ats_score}</span>
              <span className="text-sm text-blue-600">ATS Score</span>
            </div>
          )}

          {/* Job description snippet */}
          {entry.input_data?.job_description_snippet && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Job Description (snippet)
              </p>
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 leading-relaxed">
                {String(entry.input_data.job_description_snippet)}
              </p>
            </div>
          )}

          {/* Analysis sections */}
          {entry.feature === "analyze" && Array.isArray(output.sections) && (
            <div className="space-y-4">
              {(output.sections as Array<{ title: string; items: string[] }>).map(
                (section) =>
                  section.items.length > 0 && (
                    <Section key={section.title} title={section.title} items={section.items} />
                  )
              )}
            </div>
          )}

          {/* Cover letter */}
          {entry.feature === "cover_letter" && output.cover_letter && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Cover Letter
              </p>
              <div className="rounded-xl bg-slate-50 p-5">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-800">
                  {String(output.cover_letter)}
                </pre>
              </div>
            </div>
          )}

          {/* Tailored resume */}
          {entry.feature === "tailored_resume" && (
            <div className="space-y-4">
              {output.projected_ats_score != null && (
                <div className="flex items-center gap-3 rounded-xl bg-violet-50 px-4 py-3">
                  <span className="text-2xl font-bold text-violet-700">
                    {String(output.projected_ats_score)}
                  </span>
                  <span className="text-sm text-violet-600">Projected ATS Score</span>
                </div>
              )}
              {output.tailored_resume && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Tailored Resume
                  </p>
                  <div className="rounded-xl bg-slate-50 p-5">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-slate-800">
                      {String(output.tailored_resume)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        )}
      </button>
      {open && (
        <ul className="border-t border-slate-100 px-4 py-3 space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── History Card ──────────────────────────────────────────────────────────────

function HistoryCard({
  entry,
  onView,
  onDelete,
}: {
  entry: HistoryEntry;
  onView: () => void;
  onDelete: () => void;
}) {
  const meta = featureMeta(entry.feature);
  const Icon = meta.icon;
  const date = new Date(entry.created_at);

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition hover:border-slate-300 hover:shadow">
      {/* Icon */}
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}>
        <Icon className={`h-4 w-4 ${meta.color}`} />
      </div>

      {/* Main info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
          {entry.ats_score != null && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              ATS {entry.ats_score}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-sm font-medium text-slate-800">
          {entry.title || meta.label}
        </p>
        <p className="text-xs text-slate-400">
          {date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
        <button
          onClick={onView}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          View
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const { isSignedIn, isLoaded, user } = useUser();

  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<HistoryFeature | "all">("all");
  const [selected, setSelected] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    (async () => {
      setLoading(true);
      const data = await loadHistory(user.id);
      setEntries(data);
      setLoading(false);
    })();
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <LockedFeaturePage
        icon={Clock}
        tileColor="slate"
        title="Activity History"
        description="Every resume analysis, tailored resume, and cover letter — saved and revisitable. Pick up where you left off."
        features={[
          "All your past analyses in one place",
          "Re-read any cover letter or tailored resume",
          "Full analysis results always accessible",
          "Delete entries you no longer need",
        ]}
        ctaText="Sign up free"
        ctaHref="/sign-up"
        secondaryText="Already have an account? Sign in"
        secondaryHref="/sign-in"
      />
    );
  }

  async function handleDelete(entry: HistoryEntry) {
    if (!confirm("Delete this entry?")) return;
    await deleteHistoryEntry(entry.id, user!.id);
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
  }

  const filtered =
    filter === "all" ? entries : entries.filter((e) => e.feature === filter);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {selected && (
        <DetailModal entry={selected} onClose={() => setSelected(null)} />
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
            <Clock className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Activity History</h1>
            <p className="text-xs text-slate-500">
              {entries.length === 0
                ? "No activity yet"
                : `${entries.length} entr${entries.length !== 1 ? "ies" : "y"} saved`}
            </p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      {entries.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filter === "all"
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({entries.length})
          </button>
          {(Object.keys(FEATURES) as HistoryFeature[])
            .filter((f) => entries.some((e) => e.feature === f))
            .map((f) => {
              const meta = featureMeta(f);
              const count = entries.filter((e) => e.feature === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    filter === f
                      ? `${meta.bg} ${meta.color} ring-1 ring-current`
                      : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {meta.label} ({count})
                </button>
              );
            })}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
            <Clock className="h-7 w-7 text-slate-300" />
          </div>
          <h2 className="text-base font-semibold text-slate-800">No history yet</h2>
          <p className="mt-1 max-w-xs text-sm text-slate-500">
            Your analyses, cover letters, and tailored resumes will appear here automatically after you generate them.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">No entries for this filter.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((entry) => (
            <HistoryCard
              key={entry.id}
              entry={entry}
              onView={() => setSelected(entry)}
              onDelete={() => handleDelete(entry)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
