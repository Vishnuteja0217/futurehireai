"use client";

// ============================================================
// Settings page — /app/settings
//
// Currently shows:
//   - Current subscription plan + status
//   - "Manage subscription" button → Stripe Customer Portal
//
// Future home for:
//   - Notification preferences
//   - Profile updates
//   - API keys (if we offer programmatic access)
// ============================================================

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useSupabaseClient } from "@/lib/supabase";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";

interface Subscription {
  plan: string;
  status: string;
  current_period_end: string | null;
  stripe_customer_id: string | null;
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const supabase = useSupabaseClient();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load subscription data on mount
  useEffect(() => {
    if (!isLoaded || !user) return;

    async function load() {
      try {
        const { data } = await supabase
          .from("user_subscriptions")
          .select("plan, status, current_period_end, stripe_customer_id")
          .eq("user_id", user!.id)
          .maybeSingle();

        setSub(data);
      } catch (err) {
        console.error("Failed to load subscription:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [isLoaded, user, supabase]);

  async function openPortal() {
    setPortalLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to open billing portal.");
        setPortalLoading(false);
        return;
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setError("Network error. Please try again.");
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const planLabel = formatPlan(sub?.plan ?? "free");
  const isPaid = sub?.plan === "pro" || sub?.plan === "premium" || sub?.plan === "day_pass";
  const hasStripeCustomer = !!sub?.stripe_customer_id;

  return (
    <div className="p-8 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your subscription and account preferences.
        </p>
      </header>

      {/* Subscription card */}
      <section className="bg-white border border-slate-300 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">
              Current plan
            </h2>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{planLabel}</p>
          </div>
          {isPaid && (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              {sub?.status === "active" ? "Active" : sub?.status}
            </span>
          )}
        </div>

        {sub?.current_period_end && (
          <p className="text-sm text-slate-600 mb-4">
            {sub.plan === "day_pass" ? "Expires" : "Renews"} on{" "}
            <span className="font-medium text-slate-900">
              {new Date(sub.current_period_end).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </p>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-900">
            {error}
          </div>
        )}

        {/* Actions */}
        {hasStripeCustomer ? (
          <button
            onClick={openPortal}
            disabled={portalLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 disabled:bg-slate-400 transition-colors"
          >
            {portalLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Opening portal...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Manage subscription
                <ExternalLink className="w-3 h-3 opacity-60" />
              </>
            )}
          </button>
        ) : (
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors"
          >
            See plans
          </a>
        )}

        <p className="text-xs text-slate-500 mt-3">
          {hasStripeCustomer
            ? "Update payment method, view invoices, or cancel anytime — all on Stripe."
            : "Subscribe to unlock more analyses, cover letters, and mock interviews."}
        </p>
      </section>
    </div>
  );
}

// Maps internal plan IDs to user-facing labels.
function formatPlan(plan: string): string {
  switch (plan) {
    case "free":     return "Free";
    case "day_pass": return "Day Pass";
    case "pro":      return "Pro";
    case "premium":  return "Premium";
    default:         return plan;
  }
}