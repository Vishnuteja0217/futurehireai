// Shared clients for the 1-on-1 Guidance feature.
//
// Centralizes Supabase + Resend setup so the API route doesn't repeat
// connection boilerplate. Both clients read from env vars set in .env.local
// (locally) and Vercel's project env vars (production).
//
// Server-side ONLY — uses the Supabase SERVICE_KEY (admin access).
// NEVER import this file from a Client Component or page.tsx — it would
// expose the service key to the browser.

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// ─── Supabase ────────────────────────────────────────────────────
// The service role key bypasses Row Level Security, which is what we want
// for backend writes. Browser code uses the anon key (which we don't set
// here because the browser never directly talks to Supabase).
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// ─── Resend ──────────────────────────────────────────────────────
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error("Missing RESEND_API_KEY in environment variables.");
}

export const resend = new Resend(resendApiKey);

// ─── Other config ────────────────────────────────────────────────
// Where new request notifications go (your inbox).
export const NOTIFICATION_EMAIL =
  process.env.NOTIFICATION_EMAIL ?? "vteja.devil24@gmail.com";

// Sender address — must use a verified domain in Resend.
// We verified futurehireai.com, so this is safe.
export const SENDER_FROM = "FutureHireAI <noreply@futurehireai.com>";