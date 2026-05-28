"use client";

import { useEffect, useState } from "react";

// Anonymous trial counter, stored in localStorage.
// Easy to bypass (clear cookies → 3 more trials) but enough for beta.
// Real enforcement happens server-side later in Phase 2B Part 2.

const STORAGE_KEY = "futurehireai_trial_count";
const TRIAL_LIMIT = 3;

export function useTrialCount() {
  const [trialCount, setTrialCount] = useState<number>(0);
  const [hydrated, setHydrated] = useState(false);

  // Read from localStorage AFTER mount (avoids SSR hydration mismatch)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const count = stored ? parseInt(stored, 10) : 0;
    setTrialCount(isNaN(count) ? 0 : count);
    setHydrated(true);
  }, []);

  // Call this when the user successfully runs an analyze action
  const incrementTrial = () => {
    setTrialCount((prev) => {
      const next = prev + 1;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  // Returns true if the user has hit the cap
  const hasReachedLimit = trialCount >= TRIAL_LIMIT;
  const trialsRemaining = Math.max(0, TRIAL_LIMIT - trialCount);

  return {
    trialCount,
    trialsRemaining,
    hasReachedLimit,
    incrementTrial,
    hydrated,
    limit: TRIAL_LIMIT,
  };
}