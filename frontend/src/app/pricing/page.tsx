"use client";

// ============================================================
// Pricing page — public marketing page at /pricing
// Shows 6 tiers split into Subscriptions + One-time purchases.
// Clicking a paid CTA calls /api/stripe/checkout, then redirects
// the user to Stripe's hosted Checkout page.
// ============================================================

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";

// Plan config — single source of truth for what shows on each card.
// To change a price/feature later, edit this array. Code below is generic.
const PLANS = {
  subscriptions: [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "forever",
      priceId: null,                   // No Stripe — free tier
      features: [
        "5 analyses / day",
        "Basic ATS scoring",
        "Cover letters",
      ],
      ctaLabel: "Current plan",
      featured: false,
    },
    {
      id: "pro",
      name: "Pro",
      price: "$9.99",
      period: "per month",
      priceId: "price_1TelJSFextBgiBxdYLis0yUS",
      features: [
        "50 analyses / month",
        "10 cover letters",
        "25 mock interviews",
        "Priority support",
      ],
      ctaLabel: "Subscribe",
      featured: true,                  // gets the "Most popular" badge + border accent
    },
    {
      id: "premium",
      name: "Premium",
      price: "$19.99",
      period: "per month",
      priceId: "price_1TelOUFextBgiBxdELx4FM4V",
      features: [
        "150 analyses / month",
        "30 cover letters",
        "75 mock interviews",
        "Premium support",
      ],
      ctaLabel: "Subscribe",
      featured: false,
    },
  ],
  oneTime: [
    {
      id: "day_pass",
      name: "Day Pass",
      price: "$3.99",
      period: "24-hour access",
      priceId: "price_1TelH2FextBgiBxdGHYMfN9q",
      features: [
        "20 analyses",
        "5 cover letters",
        "10 mock interviews",
      ],
      ctaLabel: "Buy now",
      featured: false,
    },
    {
      id: "one_on_one_30min",
      name: "1-on-1 (30 min)",
      price: "$14.99",
      period: "video session",
      priceId: "price_1TelVRFextBgiBxdlo76PZ6p",
      features: [
        "Resume review",
        "Quick interview prep",
        "Career questions",
      ],
      ctaLabel: "Book session",
      featured: false,
    },
    {
      id: "one_on_one_60min",
      name: "1-on-1 (60 min)",
      price: "$28.99",
      period: "video session",
      priceId: "price_1TelWQFextBgiBxdfSrcIwxQ",
      features: [
        "Deep resume audit",
        "Full mock interview",
        "Career roadmap",
      ],
      ctaLabel: "Book session",
      featured: false,
    },
  ],
};

type Plan = (typeof PLANS.subscriptions)[number];

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handles the "Subscribe" / "Buy now" / "Book session" button click.
  // Flow: send the priceId to our backend → it creates a Stripe Checkout
  // session → we redirect the browser to session.url.
  async function handleCheckout(plan: Plan) {
    if (!plan.priceId) return;                  // Free tier has no Stripe action

    if (!isSignedIn) {
      router.push("/sign-in?redirect=/pricing");
      return;
    }

    setLoadingPlanId(plan.id);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: plan.priceId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Checkout failed. Please try again.");
        setLoadingPlanId(null);
        return;
      }

      const { url } = await res.json();
      if (!url) {
        setError("No checkout URL returned. Please try again.");
        setLoadingPlanId(null);
        return;
      }

      // Hard redirect (Stripe Checkout is on a different domain)
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
      setLoadingPlanId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50/30 py-16">
      <div className="mx-auto max-w-6xl px-4">

        {/* Page header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-slate-900 mb-3">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-slate-600">
            Choose what fits your job search. Cancel anytime.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-auto max-w-2xl mb-8 rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-900">
            {error}
          </div>
        )}

        {/* SECTION 1: Subscriptions */}
        <SectionLabel>Monthly subscriptions</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {PLANS.subscriptions.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isSubscription
              loading={loadingPlanId === plan.id}
              onCheckout={() => handleCheckout(plan)}
            />
          ))}
        </div>

        {/* SECTION 2: One-time */}
        <SectionLabel>One-time purchases</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.oneTime.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isSubscription={false}
              loading={loadingPlanId === plan.id}
              onCheckout={() => handleCheckout(plan)}
            />
          ))}
        </div>

        {/* Footer trust line */}
        <p className="mt-16 text-center text-sm text-slate-500">
          Payments processed securely by Stripe. We never see your card details.
        </p>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
      {children}
    </div>
  );
}

function PlanCard({
  plan,
  isSubscription,
  loading,
  onCheckout,
}: {
  plan: Plan;
  isSubscription: boolean;
  loading: boolean;
  onCheckout: () => void;
}) {
  const isFree = plan.id === "free";

  return (
    <div
      className={`relative rounded-xl bg-white p-6 ${
        plan.featured
          ? "border-2 border-emerald-500 shadow-md"
          : "border border-slate-200"
      }`}
    >
      {plan.featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-100 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full">
          Most popular
        </div>
      )}

      <p className={`text-sm font-medium mb-2 ${plan.featured ? "text-emerald-600" : "text-slate-600"}`}>
        {plan.name}
      </p>
      <p className="text-3xl font-semibold text-slate-900 mb-1">{plan.price}</p>
      <p className="text-xs text-slate-500 mb-5">{plan.period}</p>

      <ul className="space-y-2 mb-6">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
            <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onCheckout}
        disabled={isFree || loading}
        className={`w-full rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
          isFree
            ? "bg-slate-100 text-slate-500 cursor-not-allowed"
            : plan.featured
            ? "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-400"
            : "border border-slate-300 text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        }`}
      >
        {loading ? "Loading..." : plan.ctaLabel}
      </button>

      {isSubscription && !isFree && (
        <p className="text-xs text-slate-400 text-center mt-2">Cancel anytime</p>
      )}
    </div>
  );
}