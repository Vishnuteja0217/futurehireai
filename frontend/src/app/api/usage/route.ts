// API route for tracking signed-in users' usage limits.
// GET  /api/usage  → returns { usageToday, limit, hasReachedLimit, date }
// POST /api/usage  → increments today's usage, returns updated state
//
// Storage: Clerk user's publicMetadata. Each user record holds:
//   {
//     daily:   { date: "YYYY-MM-DD",   count: N },   // Free + Day Pass
//     monthly: { period_end: ISO date, count: N }    // Pro + Premium
//   }
// Both counters live side-by-side so a user who downgrades from Pro to Free
// still has their daily counter intact.
//
// Plan lookup: queries user_subscriptions in Supabase to determine which
// limit window applies. Falls back to Free if no row found.

import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// ============================================================
// Configuration
// ============================================================

// Per-plan limits — the single source of truth for what each tier costs.
// Adjust here, no other code changes needed.
const PLAN_LIMITS: Record<string, { limit: number; window: "daily" | "monthly" }> = {
  free:      { limit: 5,    window: "daily" },
  day_pass:  { limit: 20,   window: "daily" },
  pro:       { limit: 50,   window: "monthly" },
  premium:   { limit: 150,  window: "monthly" },
};

// Internal admin emails that bypass the daily limit entirely.
const ADMIN_EMAILS = new Set<string>([
  "vishnuteja564@gmail.com",
]);

// Supabase service client (bypasses RLS) — needed to read user_subscriptions
// since this endpoint is server-side.
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

// ============================================================
// Helpers
// ============================================================

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function adminState() {
  return {
    date:            todayUTC(),
    usageToday:      0,
    limit:           9999,
    hasReachedLimit: false,
  };
}

// Looks up the user's active plan from Supabase.
// Returns 'free' if no subscription row exists, OR if the user's plan has
// expired (e.g., Day Pass after 24h, or canceled subscription).
async function getUserPlan(userId: string): Promise<"free" | "day_pass" | "pro" | "premium"> {
  const { data } = await supabase
    .from("user_subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return "free";

  // Subscription not active (canceled, past_due, etc.) → treat as free
  if (data.status !== "active") return "free";

  // Plan has expired (Day Pass past 24h, or sub past renewal) → treat as free
  if (data.current_period_end) {
    const expiresAt = new Date(data.current_period_end);
    if (expiresAt < new Date()) return "free";
  }

  // Plan is active and not expired
  return (data.plan ?? "free") as "free" | "day_pass" | "pro" | "premium";
}

// Reads usage metadata + auto-resets if the window has rolled over.
// Returns the normalized counter for the user's CURRENT plan.
function normalize(
  metadata: Record<string, unknown> | undefined,
  plan: "free" | "day_pass" | "pro" | "premium",
) {
  const planConfig = PLAN_LIMITS[plan];

  if (planConfig.window === "daily") {
    const today = todayUTC();
    const daily = (metadata?.daily ?? {}) as { date?: string; count?: number };
    const stored = daily.date === today ? (daily.count ?? 0) : 0;
    return {
      date: today,
      usageToday: stored,
      limit: planConfig.limit,
      hasReachedLimit: stored >= planConfig.limit,
    };
  }

  // monthly window
  // Period key = first day of current month, e.g. "2026-06-01"
  const monthKey = new Date().toISOString().slice(0, 7) + "-01";
  const monthly = (metadata?.monthly ?? {}) as { period_end?: string; count?: number };
  const stored = monthly.period_end === monthKey ? (monthly.count ?? 0) : 0;
  return {
    date: monthKey,
    usageToday: stored,
    limit: planConfig.limit,
    hasReachedLimit: stored >= planConfig.limit,
  };
}

// ============================================================
// Route handlers
// ============================================================

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  // Admin bypass
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
  if (email && ADMIN_EMAILS.has(email)) {
    return NextResponse.json(adminState());
  }

  const plan = await getUserPlan(userId);
  return NextResponse.json(normalize(user.publicMetadata, plan));
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  // Admin bypass — never increment
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
  if (email && ADMIN_EMAILS.has(email)) {
    return NextResponse.json(adminState());
  }

  const plan = await getUserPlan(userId);
  const current = normalize(user.publicMetadata, plan);

  // Already at cap — refuse the increment so the server can't be tricked
  // into pushing past the limit by repeated requests.
  if (current.hasReachedLimit) {
    return NextResponse.json(current, { status: 200 });
  }

  const planConfig = PLAN_LIMITS[plan];
  const newCount = current.usageToday + 1;

  // Build the updated publicMetadata, keeping the OTHER counter intact.
  const existingMeta = (user.publicMetadata ?? {}) as Record<string, unknown>;
  let updatedMeta: Record<string, unknown>;

  if (planConfig.window === "daily") {
    updatedMeta = {
      ...existingMeta,
      daily: { date: current.date, count: newCount },
    };
  } else {
    updatedMeta = {
      ...existingMeta,
      monthly: { period_end: current.date, count: newCount },
    };
  }

  await client.users.updateUserMetadata(userId, {
    publicMetadata: updatedMeta,
  });

  return NextResponse.json({
    ...current,
    usageToday: newCount,
    hasReachedLimit: newCount >= planConfig.limit,
  });
}