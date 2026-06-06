// ============================================================
// Stripe Checkout endpoint — creates a Stripe Checkout Session
//
// Flow:
//   1. Frontend calls POST /api/stripe/checkout with { priceId }
//   2. We look up the user's Clerk identity
//   3. We create a Stripe Customer (if they don't have one yet)
//   4. We create a Stripe Checkout Session
//   5. We return the session URL → frontend redirects user there
//
// Security:
//   - Requires authenticated Clerk user (no anonymous checkouts)
//   - Uses idempotency keys (audio's recommendation #1)
//   - Validates price ID is one of our allowed prices (no arbitrary charges)
// ============================================================

import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { randomUUID } from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

const ALLOWED_PRICES = new Set<string>([
  "price_1TelH2FextBgiBxdGHYMfN9q", // Day Pass
  "price_1TelJSFextBgiBxdYLis0yUS", // Pro
  "price_1TelOUFextBgiBxdELx4FM4V", // Premium
  "price_1TelVRFextBgiBxdlo76PZ6p", // 1-on-1 30min
  "price_1TelWQFextBgiBxdfSrcIwxQ", // 1-on-1 60min
]);

const SUBSCRIPTION_PRICES = new Set<string>([
  "price_1TelJSFextBgiBxdYLis0yUS", // Pro
  "price_1TelOUFextBgiBxdELx4FM4V", // Premium
]);

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let priceId: string;
  try {
    const body = await req.json();
    priceId = body.priceId;
    if (typeof priceId !== "string" || !ALLOWED_PRICES.has(priceId)) {
      return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress;

  if (!email) {
    return NextResponse.json(
      { error: "User has no email address" },
      { status: 400 },
    );
  }

  let stripeCustomerId: string;

  const { data: existing } = await supabase
    .from("user_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.stripe_customer_id) {
    stripeCustomerId = existing.stripe_customer_id;
  } else {
    const customer = await stripe.customers.create(
      {
        email,
        metadata: { clerk_user_id: userId },
      },
      { idempotencyKey: `customer-${userId}` },
    );
    stripeCustomerId = customer.id;

    await supabase.from("user_subscriptions").upsert({
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  }

  const isSubscription = SUBSCRIPTION_PRICES.has(priceId);
  const mode: "subscription" | "payment" = isSubscription ? "subscription" : "payment";

  const origin = req.headers.get("origin") ?? "https://futurehireai.com";

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode,
        customer: stripeCustomerId,
        line_items: [{ price: priceId, quantity: 1 }],

        success_url: `${origin}/app?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing?checkout=cancelled`,

        metadata: {
          user_id: userId,
          price_id: priceId,
        },

        subscription_data: isSubscription
          ? { metadata: { user_id: userId, price_id: priceId } }
          : undefined,
      },
      {
        idempotencyKey: `checkout-${userId}-${priceId}-${randomUUID()}`,
      },
    );

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Failed to create Stripe checkout session:", err);
    return NextResponse.json(
      { error: "Checkout session creation failed" },
      { status: 500 },
    );
  }
}