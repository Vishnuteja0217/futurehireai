// API route for tracking signed-in users' daily usage.
// GET  /api/usage  → returns { usageToday, limit, hasReachedLimit, date }
// POST /api/usage  → increments today's usage, returns updated state
//
// Storage: Clerk user's publicMetadata. Each user record holds:
//   { lastActiveDate: "YYYY-MM-DD", usageToday: number }
// Resets automatically when the date changes.

import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const DAILY_LIMIT = 5;

// Today's date in YYYY-MM-DD format (UTC).
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

// Reads existing metadata + auto-resets if the day has rolled over.
function normalize(metadata: Record<string, unknown> | undefined) {
  const today = todayUTC();
  const lastActiveDate = (metadata?.lastActiveDate as string) ?? today;
  const storedUsage = (metadata?.usageToday as number) ?? 0;
  const usageToday = lastActiveDate === today ? storedUsage : 0;

  return {
    date: today,
    usageToday,
    limit: DAILY_LIMIT,
    hasReachedLimit: usageToday >= DAILY_LIMIT,
  };
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return NextResponse.json(normalize(user.publicMetadata));
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const current = normalize(user.publicMetadata);

  // Already at cap — refuse the increment so the server can't be tricked
  // into pushing past the limit by repeated requests.
  if (current.hasReachedLimit) {
    return NextResponse.json(current, { status: 200 });
  }

  const next = {
    ...current,
    usageToday: current.usageToday + 1,
    hasReachedLimit: current.usageToday + 1 >= DAILY_LIMIT,
  };

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      lastActiveDate: next.date,
      usageToday: next.usageToday,
    },
  });

  return NextResponse.json(next);
}