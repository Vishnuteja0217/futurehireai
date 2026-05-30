import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  NOTIFICATION_EMAIL,
  SENDER_FROM,
  resend,
  supabase,
} from "@/lib/guidance-clients";

// POST /api/guidance
// Receives a 1-on-1 session request from the form, persists it to Supabase,
// sends two emails (auto-reply to user + notification to us), and returns
// a reference number the user can quote in follow-up emails.
//
// Auth: signed-in users only. Anonymous visitors should never reach this route
// because the form is rendered behind a LockedFeaturePage in the UI.
// We still check auth here as a defense-in-depth measure.

export async function POST(request: Request) {
  // ─── 1. Authenticate ─────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Pull Clerk user data so we can prefill name/email if the form omitted them
  // (defensive — the form should always provide both).
  const user = await currentUser();

  // ─── 2. Parse + validate body ────────────────────────────────
  let body: GuidanceRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const validation = validateBody(body);
  if (!validation.ok) {
    return NextResponse.json(
      { error: "validation_failed", details: validation.errors },
      { status: 400 },
    );
  }

  // ─── 3. Persist to Supabase ──────────────────────────────────
  const insertPayload = {
    clerk_user_id: userId,
    full_name: body.fullName.trim(),
    email: body.email.trim(),
    session_length: body.sessionLength,
    technology: body.technology.trim(),
    current_status: body.currentStatus,
    goal: body.goal.trim(),
    preferred_times: body.preferredTimes.trim(),
    linkedin_url: body.linkedinUrl?.trim() || null,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("mentorship_requests")
    .insert(insertPayload)
    .select("id, created_at")
    .single();

  if (insertError || !inserted) {
    console.error("Supabase insert failed:", insertError);
    return NextResponse.json(
      { error: "could_not_save_request" },
      { status: 500 },
    );
  }

  // Short reference number derived from the UUID — easier for the user to
  // quote in follow-up emails than a full UUID.
  const referenceNumber = makeReferenceNumber(inserted.id);

  // ─── 4. Fire both emails (best-effort, don't block on failure) ────
  // We've already saved to Supabase, so even if emails fail you can still
  // see the request in your dashboard. Email errors are logged but not surfaced
  // to the user — they'll just see the success screen.
  const userEmailHtml = renderUserEmail({
    fullName: insertPayload.full_name,
    sessionLength: insertPayload.session_length,
    technology: insertPayload.technology,
    goal: insertPayload.goal,
    preferredTimes: insertPayload.preferred_times,
    referenceNumber,
  });

  const adminEmailHtml = renderAdminEmail({
    referenceNumber,
    payload: insertPayload,
    clerkUserId: userId,
    clerkEmail: user?.emailAddresses[0]?.emailAddress,
  });

// Send both emails in parallel — they're independent.
  // We log results loudly so we can debug send failures from the terminal.
  console.log("📧 Attempting to send emails…");
  console.log("  From:", SENDER_FROM);
  console.log("  User to:", insertPayload.email);
  console.log("  Admin to:", NOTIFICATION_EMAIL);

  const emailResults = await Promise.allSettled([
    resend.emails.send({
      from: SENDER_FROM,
      to: insertPayload.email,
      subject: "We received your 1-on-1 session request",
      html: userEmailHtml,
    }),
    resend.emails.send({
      from: SENDER_FROM,
      to: NOTIFICATION_EMAIL,
      subject: `New 1-on-1 request · ${insertPayload.full_name} · ${insertPayload.technology}`,
      html: adminEmailHtml,
    }),
  ]);

  emailResults.forEach((r, idx) => {
    const which = idx === 0 ? "USER" : "ADMIN";
    if (r.status === "rejected") {
      console.error(`❌ ${which} email REJECTED:`, r.reason);
    } else {
      // Resend's send() returns { data, error } — error is non-null on failure
      const { data, error } = r.value as { data: unknown; error: unknown };
      if (error) {
        console.error(`❌ ${which} email FAILED:`, JSON.stringify(error, null, 2));
      } else {
        console.log(`✅ ${which} email sent:`, JSON.stringify(data));
      }
    }
  });

  // ─── 5. Respond ──────────────────────────────────────────────
  return NextResponse.json({
    ok: true,
    referenceNumber,
  });
}

// ─── Types ───────────────────────────────────────────────────────
interface GuidanceRequestBody {
  fullName: string;
  email: string;
  sessionLength: "30min" | "60min";
  technology: string;
  currentStatus: "student" | "job_seeker" | "career_switcher";
  goal: string;
  preferredTimes: string;
  linkedinUrl?: string;
}

// ─── Validation ──────────────────────────────────────────────────
function validateBody(body: unknown): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (typeof body !== "object" || body === null) {
    return { ok: false, errors: ["body_must_be_object"] };
  }
  const b = body as Record<string, unknown>;

  const requireString = (key: string, minLen = 1) => {
    if (typeof b[key] !== "string" || (b[key] as string).trim().length < minLen) {
      errors.push(`${key}_invalid`);
    }
  };

  requireString("fullName", 2);
  requireString("email", 5);
  requireString("technology", 2);
  requireString("goal", 10);
  requireString("preferredTimes", 5);

  if (b.sessionLength !== "30min" && b.sessionLength !== "60min") {
    errors.push("sessionLength_invalid");
  }
  if (
    b.currentStatus !== "student" &&
    b.currentStatus !== "job_seeker" &&
    b.currentStatus !== "career_switcher"
  ) {
    errors.push("currentStatus_invalid");
  }

  // Loose email check — anything with @ and a dot. Resend will hard-fail on
  // genuinely bad addresses anyway.
  if (typeof b.email === "string" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email)) {
    errors.push("email_format_invalid");
  }

  if (b.linkedinUrl != null && typeof b.linkedinUrl !== "string") {
    errors.push("linkedinUrl_invalid");
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

// ─── Reference number ────────────────────────────────────────────
// Takes the first 6 hex chars of the UUID and uppercases them.
// Format: GUIDE-A4F2B1 — short, readable, copy-pasteable.
function makeReferenceNumber(uuid: string): string {
  return `GUIDE-${uuid.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

// ─── Email templates ─────────────────────────────────────────────
// Plain HTML — kept inline to avoid an extra build dependency on react-email.
// Inline styles because most email clients strip <style> blocks.

function renderUserEmail(args: {
  fullName: string;
  sessionLength: "30min" | "60min";
  technology: string;
  goal: string;
  preferredTimes: string;
  referenceNumber: string;
}): string {
  const sessionLabel = args.sessionLength === "60min" ? "60-minute" : "30-minute";
  const price = args.sessionLength === "60min" ? "$49" : "$29";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px;">
        Hi ${escapeHtml(args.fullName.split(" ")[0] || args.fullName)},
      </h1>
      <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
        Thanks for requesting a 1-on-1 session with FutureHireAI. We received your
        request and will get back to you within 48 hours (usually much sooner).
      </p>

      <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 0 0 20px;">
        <p style="font-size: 12px; font-weight: 600; color: #6b7280; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">Your request</p>
        <p style="font-size: 13px; line-height: 1.7; margin: 0; color: #374151;">
          <strong>Session:</strong> ${sessionLabel} (${price})<br/>
          <strong>Focus area:</strong> ${escapeHtml(args.technology)}<br/>
          <strong>What you want help with:</strong> ${escapeHtml(args.goal)}<br/>
          <strong>Preferred times:</strong> ${escapeHtml(args.preferredTimes)}
        </p>
      </div>

      <p style="font-size: 14px; font-weight: 600; margin: 20px 0 8px;">What happens next</p>
      <ol style="font-size: 14px; line-height: 1.7; margin: 0 0 20px; padding-left: 20px; color: #374151;">
        <li>We'll match you with a mentor who matches your focus area.</li>
        <li>You'll receive an email with the mentor's details and a secure payment link.</li>
        <li>Once payment is confirmed, we send the calendar invite and meeting link.</li>
      </ol>

      <p style="font-size: 13px; line-height: 1.6; margin: 0 0 16px; color: #4b5563;">
        Have questions in the meantime? Just reply to this email.
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        Reference: <strong>${args.referenceNumber}</strong> · Please mention this in any follow-up emails.
      </p>
      <p style="font-size: 12px; color: #9ca3af; margin: 8px 0 0;">
        — The FutureHireAI team
      </p>
    </div>
  `;
}

function renderAdminEmail(args: {
  referenceNumber: string;
  payload: {
    full_name: string;
    email: string;
    session_length: "30min" | "60min";
    technology: string;
    current_status: "student" | "job_seeker" | "career_switcher";
    goal: string;
    preferred_times: string;
    linkedin_url: string | null;
  };
  clerkUserId: string;
  clerkEmail?: string;
}): string {
  const { payload } = args;
  const sessionLabel = payload.session_length === "60min" ? "60-min ($49)" : "30-min ($29)";
  const statusLabel = {
    student: "Student",
    job_seeker: "Job seeker",
    career_switcher: "Career switcher",
  }[payload.current_status];

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <h2 style="font-size: 16px; font-weight: 600; margin: 0 0 6px;">
        New 1-on-1 request · ${args.referenceNumber}
      </h2>
      <p style="font-size: 12px; color: #6b7280; margin: 0 0 20px;">${sessionLabel}</p>

      <table style="font-size: 13px; line-height: 1.7; border-collapse: collapse; width: 100%;">
        <tr><td style="color: #6b7280; padding-right: 12px; vertical-align: top; width: 130px;">Name</td><td>${escapeHtml(payload.full_name)}</td></tr>
        <tr><td style="color: #6b7280; padding-right: 12px; vertical-align: top;">Email</td><td><a href="mailto:${escapeHtml(payload.email)}" style="color: #2563eb;">${escapeHtml(payload.email)}</a></td></tr>
        <tr><td style="color: #6b7280; padding-right: 12px; vertical-align: top;">Focus</td><td>${escapeHtml(payload.technology)}</td></tr>
        <tr><td style="color: #6b7280; padding-right: 12px; vertical-align: top;">Status</td><td>${statusLabel}</td></tr>
        <tr><td style="color: #6b7280; padding-right: 12px; vertical-align: top;">Preferred times</td><td>${escapeHtml(payload.preferred_times)}</td></tr>
        ${
          payload.linkedin_url
            ? `<tr><td style="color: #6b7280; padding-right: 12px; vertical-align: top;">LinkedIn</td><td><a href="${escapeHtml(payload.linkedin_url)}" style="color: #2563eb;">${escapeHtml(payload.linkedin_url)}</a></td></tr>`
            : ""
        }
      </table>

      <div style="margin: 20px 0 0;">
        <p style="font-size: 12px; font-weight: 600; color: #6b7280; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.05em;">What they want help with</p>
        <p style="font-size: 13px; line-height: 1.6; margin: 0; padding: 12px; background: #f9fafb; border-left: 3px solid #d1d5db; color: #1f2937; white-space: pre-wrap;">${escapeHtml(payload.goal)}</p>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

      <p style="font-size: 11px; color: #9ca3af; margin: 0;">
        Clerk ID: <code>${escapeHtml(args.clerkUserId)}</code>${args.clerkEmail ? ` · Clerk email: ${escapeHtml(args.clerkEmail)}` : ""}
      </p>
      <p style="font-size: 11px; color: #9ca3af; margin: 4px 0 0;">
        View all requests in your Supabase dashboard.
      </p>
    </div>
  `;
}

// Minimal HTML escape — prevents user-submitted text from breaking the email
// markup (or worse, executing as HTML in someone's inbox).
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}