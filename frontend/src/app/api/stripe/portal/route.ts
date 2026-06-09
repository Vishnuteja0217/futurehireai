// ============================================================
// Stripe Customer Portal endpoint
//
// Creates a portal session for the signed-in user, returns the URL.
// Frontend redirects the user there → Stripe handles cancel / card update / etc.
// When user is done, Stripe sends them back to /app/settings.
//
// Security:
//   - Requires authenticated Clerk user
//   - Looks up THIS user's Stripe customer ID — can't access other users
// ============================================================

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Look up this user's Stripe customer ID
  const { data: subRow } = await supabase
    .from("user_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!subRow?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No Stripe customer found. Subscribe first to manage billing." },
      { status: 400 },
    );
  }

  const origin = req.headers.get("origin") ?? "https://www.futurehireai.com";

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: subRow.stripe_customer_id,
      return_url: `${origin}/app/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Failed to create portal session:", err);
    return NextResponse.json(
      { error: "Portal session creation failed" },
      { status: 500 },
    );
  }
}