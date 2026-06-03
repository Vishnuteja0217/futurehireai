"use client";

import { useSession } from "@clerk/nextjs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";

// Hook that returns a Supabase client which auto-attaches the current
// Clerk session JWT to every request. Supabase then uses the JWT to
// enforce row-level security (only the row's owner can read/write).
//
// This replaces the old `getSupabase()` global singleton, which had no
// auth context and was getting blocked by our new RLS policies.
//
// Usage in a client component:
//   const supabase = useSupabaseClient();
//   const { data } = await supabase.from("activity_history").select();
//
// Important: this hook MUST run inside a component (it uses useSession).
// Server-side code should use the SUPABASE_SERVICE_KEY pattern instead.
export function useSupabaseClient(): SupabaseClient {
  const { session } = useSession();

  return useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error("Supabase env vars are not set.");
    }

    return createClient(url, key, {
      // Tell supabase-js to call this function before every request.
      // It fetches a fresh Clerk JWT scoped for Supabase (claim role=authenticated).
      // Supabase's third-party-auth integration verifies the JWT against
      // Clerk's JWKS endpoint we configured earlier.
      async accessToken() {
        return session?.getToken() ?? null;
      },
    });
  }, [session]);
}