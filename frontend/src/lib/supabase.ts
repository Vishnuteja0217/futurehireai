import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazily created so the client is only instantiated in the browser
// (avoids "supabaseUrl is required" during Next.js static prerendering)
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase env vars are not set.");
    _client = createClient(url, key);
  }
  return _client;
}
