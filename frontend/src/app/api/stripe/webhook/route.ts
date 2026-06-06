// ============================================================
// Stripe webhook handler — receives events from Stripe and updates DB
//
// This is the "source of truth" for subscription state. We don't trust
// the frontend (users can be tricked or malicious). We only trust events
// that Stripe sends us, AFTER verifying their signature.
//
// Flow:
//   1. Receive POST from Stripe with event payload
//   2. Verify Stripe signature (security)
//   3. Check if event was already processed (idempotency)
//   4. Insert into stripe_events ledger (immutable audit trail)
//   5. Update user_subscriptions or purchases based on event type
//   6. Mark event as processed
//   7. Return 200 to Stripe
//
// Security: Uses SUPABASE_SERVICE_KEY (bypasses RLS).
// Never expose this endpoint to client-side code.
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Pinned to the SDK's expected API version. Matches the Stripe dashboard
  // settings (Developers → API version: 2026-05-27.dahlia).
  apiVersion: "2026-05-27.dahlia",
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

// Map Stripe Price IDs to internal plan names.
// These are the IDs you saved earlier from Stripe dashboard.
// Updating prices: just edit this map; no code changes elsewhere needed.
const PRICE_TO_PLAN: Record<string, "day_pass" | "pro" | "premium" | "one_on_one_30min" | "one_on_one_60min"> = {
  // Day Pass (one-time)
  "price_1TelH2FextBgiBxdGHYMfN9q": "day_pass",

  // Pro subscription ($9.99/mo)
  "price_1TelJSFextBgiBxdYLis0yUS": "pro",

  // Premium subscription ($19.99/mo)
  "price_1TelOUFextBgiBxdELx4FM4V": "premium",

  // 1-on-1 30min ($14.99)
  "price_1TelVRFextBgiBxdlo76PZ6p": "one_on_one_30min",

  // 1-on-1 60min ($28.99)
  "price_1TelWQFextBgiBxdfSrcIwxQ": "one_on_one_60min",
};

// Disable Next.js body parsing — we need the raw bytes for signature verification.
// (Stripe signs the raw bytes; any parsing would invalidate the signature.)
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;

  // ── STEP 1: Verify signature ──
  // Without this, anyone could POST fake events to upgrade themselves to Premium.
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Stripe signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── STEP 2: Idempotency check ──
  // Stripe sometimes sends the same event multiple times (network retry, etc.).
  // If we've seen this event ID before, skip processing.
  const existing = await supabase
    .from("stripe_events")
    .select("id, status")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existing.data) {
    console.log(`Skipping duplicate event ${event.id} (already ${existing.data.status})`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  // ── STEP 3: Log to immutable ledger ──
  // We insert BEFORE processing, so if processing crashes we still have the event.
  const { data: ledgerRow, error: ledgerError } = await supabase
    .from("stripe_events")
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event,
      status: "received",
    })
    .select("id")
    .single();

  if (ledgerError) {
    console.error("Failed to log event to ledger:", ledgerError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // ── STEP 4: Process the event ──
  try {
    await processEvent(event);

    // Mark ledger row as processed
    await supabase
      .from("stripe_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("id", ledgerRow.id);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Failed to process event ${event.id}:`, err);

    // Mark ledger row as failed (we can replay later)
    await supabase
      .from("stripe_events")
      .update({ status: "failed", processed_at: new Date().toISOString() })
      .eq("id", ledgerRow.id);

    return NextResponse.json({ error: "Processing error" }, { status: 500 });
  }
}

// ============================================================
// Event processors
// ============================================================

async function processEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);

    case "customer.subscription.created":
    case "customer.subscription.updated":
      return handleSubscriptionUpdated(event.data.object as Stripe.Subscription);

    case "customer.subscription.deleted":
      return handleSubscriptionDeleted(event.data.object as Stripe.Subscription);

    case "invoice.payment_succeeded":
    case "invoice.payment_failed":
      return handleInvoicePayment(event.data.object as Stripe.Invoice, event.type);

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

// Handles BOTH subscription checkouts (Pro/Premium) and one-time purchases
// (Day Pass, 1-on-1 sessions). Stripe sends this event for both flows.
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  if (!userId) {
    console.warn(`Checkout session ${session.id} has no user_id metadata — skipping`);
    return;
  }

  // SUBSCRIPTIONS (Pro / Premium): the subscription.created event handles the actual state
  // update. We only need to associate the Stripe customer with our user here.
  if (session.mode === "subscription") {
    await supabase.from("user_subscriptions").upsert({
      user_id: userId,
      stripe_customer_id: session.customer as string,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    return;
  }

  // ONE-TIME PURCHASES (Day Pass, 1-on-1)
  if (session.mode === "payment") {
    const priceId = session.metadata?.price_id;
    const product = priceId ? PRICE_TO_PLAN[priceId] : null;

    if (!product) {
      console.warn(`Checkout session ${session.id} has unknown product`);
      return;
    }

    // Day Pass also bumps the user's current plan for 24 hours
    if (product === "day_pass") {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await supabase.from("user_subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        plan: "day_pass",
        status: "active",
        current_period_end: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }

    // All one-time purchases get logged in `purchases`
    await supabase.from("purchases").insert({
      user_id: userId,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
      product_type: product,
      amount_cents: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      status: "completed",
      expires_at: product === "day_pass"
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null,
    });
  }
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  // Find which user this subscription belongs to (via stripe_customer_id)
  const { data: existing } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", sub.customer as string)
    .maybeSingle();

  if (!existing) {
    console.warn(`Subscription ${sub.id} has no matching user_subscriptions row`);
    return;
  }

  // Figure out which plan from the price ID
  const priceId = sub.items.data[0]?.price.id;
  const plan = priceId ? PRICE_TO_PLAN[priceId] : null;
  if (!plan || (plan !== "pro" && plan !== "premium")) {
    console.warn(`Subscription ${sub.id} has unknown plan for price ${priceId}`);
    return;
  }

  // In newer Stripe API, current_period_end moved from Subscription to SubscriptionItem.
  // Use the first item's period end (all items share the same period for our use case).
  const periodEnd = sub.items.data[0]?.current_period_end;

  await supabase.from("user_subscriptions").update({
    stripe_subscription_id: sub.id,
    plan: plan,
    status: sub.status,
    current_period_end: periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  }).eq("user_id", existing.user_id);
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  await supabase.from("user_subscriptions").update({
    plan: "free",
    status: "canceled",
    stripe_subscription_id: null,
    current_period_end: null,
    updated_at: new Date().toISOString(),
  }).eq("stripe_customer_id", sub.customer as string);
}

async function handleInvoicePayment(invoice: Stripe.Invoice, eventType: string) {
  // In newer Stripe API, invoice → subscription is no longer a direct property.
  // The subscription ID is on the parent or via line items.
  // We look at the first line item's subscription reference.
  const lineItem = invoice.lines?.data?.[0];
  const subscriptionId = typeof lineItem?.subscription === "string"
    ? lineItem.subscription
    : lineItem?.subscription?.id ?? null;

  if (!subscriptionId) return;

  if (eventType === "invoice.payment_failed") {
    await supabase.from("user_subscriptions").update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    }).eq("stripe_subscription_id", subscriptionId);
  }
  // payment_succeeded events update the subscription via subscription.updated webhook,
  // no extra action needed here.
}