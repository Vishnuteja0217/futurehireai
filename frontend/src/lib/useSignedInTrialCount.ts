"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";

// Tracks daily usage for signed-in users.
// Talks to /api/usage which reads/writes Clerk publicMetadata.
//
// Mirrors the shape of useTrialCount (anonymous version) so components
// can swap between them with minimal logic.

interface UsageState {
  usageToday: number;
  limit: number;
  hasReachedLimit: boolean;
  date: string;
}

export function useSignedInTrialCount() {
  const { isSignedIn, isLoaded } = useUser();
  const [state, setState] = useState<UsageState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Fetch current usage when user signs in / page loads.
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setHydrated(true);
      return;
    }

    let cancelled = false;
    fetch("/api/usage")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setState(data);
        setHydrated(true);
      })
      .catch(() => {
        if (cancelled) return;
        setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  const incrementUsage = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await fetch("/api/usage", { method: "POST" });
      const data = await res.json();
      setState(data);
    } catch (err) {
      console.error("Failed to update usage:", err);
    }
  }, [isSignedIn]);

  return {
    usageToday: state?.usageToday ?? 0,
    limit: state?.limit ?? 5,
    usageRemaining: Math.max(0, (state?.limit ?? 5) - (state?.usageToday ?? 0)),
    hasReachedLimit: state?.hasReachedLimit ?? false,
    hydrated,
    incrementUsage,
  };
}