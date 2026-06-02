"use client";

import { useUser } from "@clerk/nextjs";
import {
  Briefcase,
  ClipboardList,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { LockedFeaturePage } from "@/components/layout/LockedFeaturePage";
import { getSupabase } from "@/lib/supabase";
import type { ApplicationStatus, JobApplication } from "@/lib/types";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUSES: { value: ApplicationStatus; label: string; color: string; bg: string }[] =
  [
    { value: "applied",      label: "Applied",      color: "text-blue-700",   bg: "bg-blue-50 border-blue-200"   },
    { value: "phone_screen", label: "Phone Screen", color: "text-cyan-700",   bg: "bg-cyan-50 border-cyan-200"   },
    { value: "interviewing", label: "Interviewing", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
    { value: "offer",        label: "Offer 🎉",     color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200" },
    { value: "rejected",     label: "Rejected",     color: "text-red-700",    bg: "bg-red-50 border-red-200"     },
    { value: "withdrawn",    label: "Withdrawn",    color: "text-slate-500",  bg: "bg-slate-50 border-slate-200" },
    { value: "ghosted",      label: "Ghosted",      color: "text-slate-400",  bg: "bg-slate-50 border-slate-200" },
  ];

function statusMeta(value: ApplicationStatus) {
  return STATUSES.find((s) => s.value === value) ?? STATUSES[0];
}

// ── Add Application Modal ─────────────────────────────────────────────────────

interface AddModalProps {
  userId: string;
  onClose: () => void;
  onSaved: (app: JobApplication) => void;
}

function AddModal({ userId, onClose, onSaved }: AddModalProps) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    company: "",
    role: "",
    url: "",
    date_applied: today,
    status: "applied" as ApplicationStatus,
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) {
      setError("Company and role are required.");
      return;
    }
    setSaving(true);
    setError("");
    const { data, error: err } = await getSupabase()
      .from("job_applications")
      .insert({
        user_id:      userId,
        company:      form.company.trim(),
        role:         form.role.trim(),
        url:          form.url.trim() || null,
        date_applied: form.date_applied,
        status:       form.status,
        notes:        form.notes.trim() || null,
      })
      .select()
      .single();

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved(data as JobApplication);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <Briefcase className="h-4 w-4 text-amber-600" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Add Application</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Company *</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-blue-500 focus:border-blue-500 focus:ring-1"
                placeholder="e.g. Google"
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Role *</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-blue-500 focus:border-blue-500 focus:ring-1"
                placeholder="e.g. Software Engineer"
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Job Posting URL</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-blue-500 focus:border-blue-500 focus:ring-1"
              placeholder="https://..."
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Date Applied</label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-blue-500 focus:border-blue-500 focus:ring-1"
                value={form.date_applied}
                onChange={(e) => set("date_applied", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Status</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-blue-500 focus:border-blue-500 focus:ring-1"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Notes</label>
            <textarea
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-blue-500 focus:border-blue-500 focus:ring-1"
              placeholder="Recruiter name, interview date, anything useful..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Summary Stats ─────────────────────────────────────────────────────────────

function SummaryBar({ apps }: { apps: JobApplication[] }) {
  const total = apps.length;
  if (total === 0) return null;

  const counts = STATUSES.map((s) => ({
    ...s,
    count: apps.filter((a) => a.status === s.value).length,
  })).filter((s) => s.count > 0);

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-2xl font-bold text-slate-900">{total}</p>
        <p className="text-xs text-slate-500">Total Applied</p>
      </div>
      {counts.slice(0, 3).map((s) => (
        <div key={s.value} className={`rounded-xl border p-4 shadow-sm ${s.bg}`}>
          <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
          <p className={`text-xs ${s.color} opacity-80`}>{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TrackerPage() {
  const { isSignedIn, isLoaded, user } = useUser();

  const [apps, setApps]       = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Load applications
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    (async () => {
      setLoading(true);
      const { data } = await getSupabase()
        .from("job_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("date_applied", { ascending: false });
      setApps((data as JobApplication[]) ?? []);
      setLoading(false);
    })();
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded) return null;

  // Unauthenticated
  if (!isSignedIn) {
    return (
      <LockedFeaturePage
        icon={ClipboardList}
        tileColor="amber"
        title="Application Tracker"
        description="Track every job you apply to in one place. Status, notes, contacts, deadlines — no more spreadsheets."
        features={[
          "Log every application with one click",
          "Track status from applied → offer",
          "Add notes, URLs, and interview dates",
          "See your pipeline at a glance",
        ]}
        ctaText="Sign up free"
        ctaHref="/sign-up"
        secondaryText="Already have an account? Sign in"
        secondaryHref="/sign-in"
      />
    );
  }

  // ── Signed-in view ─────────────────────────────────────────────────────────

  async function handleStatusChange(app: JobApplication, newStatus: ApplicationStatus) {
    setUpdatingId(app.id);
    const { data } = await getSupabase()
      .from("job_applications")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", app.id)
      .eq("user_id", user!.id)
      .select()
      .single();
    if (data) {
      setApps((prev) => prev.map((a) => (a.id === app.id ? (data as JobApplication) : a)));
    }
    setUpdatingId(null);
  }

  async function handleDelete(app: JobApplication) {
    if (!confirm(`Delete "${app.company} — ${app.role}"?`)) return;
    await getSupabase()
      .from("job_applications")
      .delete()
      .eq("id", app.id)
      .eq("user_id", user!.id);
    setApps((prev) => prev.filter((a) => a.id !== app.id));
  }

  const filtered =
    filterStatus === "all" ? apps : apps.filter((a) => a.status === filterStatus);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {showModal && (
        <AddModal
          userId={user.id}
          onClose={() => setShowModal(false)}
          onSaved={(app) => setApps((prev) => [app, ...prev])}
        />
      )}

      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <ClipboardList className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Application Tracker</h1>
            <p className="text-xs text-slate-500">
              {apps.length === 0 ? "No applications yet" : `${apps.length} application${apps.length !== 1 ? "s" : ""} tracked`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Application
        </button>
      </div>

      {/* Summary bar */}
      {apps.length > 0 && <SummaryBar apps={apps} />}

      {/* Filter tabs */}
      {apps.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filterStatus === "all"
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({apps.length})
          </button>
          {STATUSES.filter((s) => apps.some((a) => a.status === s.value)).map((s) => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition border ${
                filterStatus === s.value
                  ? `${s.bg} ${s.color} border-current`
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {s.label} ({apps.filter((a) => a.status === s.value).length})
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : apps.length === 0 ? (
        /* Empty state */
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
            <ClipboardList className="h-7 w-7 text-amber-400" />
          </div>
          <h2 className="text-base font-semibold text-slate-800">No applications yet</h2>
          <p className="mt-1 max-w-xs text-sm text-slate-500">
            Start logging the jobs you apply to and track them all in one place.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-5 flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add your first application
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">No applications with this status.</p>
        </div>
      ) : (
        /* Applications table */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Role</th>
                <th className="hidden px-4 py-3 sm:table-cell">Date Applied</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 md:table-cell">Notes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((app) => {
                const meta = statusMeta(app.status);
                return (
                  <tr key={app.id} className="group hover:bg-slate-50/60 transition">
                    {/* Company */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-medium text-slate-900">
                        {app.company}
                        {app.url && (
                          <a
                            href={app.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden text-slate-400 hover:text-blue-600 group-hover:inline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3 text-slate-600">{app.role}</td>

                    {/* Date */}
                    <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">
                      {app.date_applied}
                    </td>

                    {/* Status — inline dropdown */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        {updatingId === app.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        ) : (
                          <select
                            value={app.status}
                            onChange={(e) =>
                              handleStatusChange(app, e.target.value as ApplicationStatus)
                            }
                            className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold outline-none ${meta.bg} ${meta.color}`}
                          >
                            {STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>

                    {/* Notes */}
                    <td className="hidden max-w-[200px] truncate px-4 py-3 text-slate-400 md:table-cell">
                      {app.notes || <span className="italic text-slate-300">—</span>}
                    </td>

                    {/* Delete */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(app)}
                        className="hidden rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 group-hover:inline-flex"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
