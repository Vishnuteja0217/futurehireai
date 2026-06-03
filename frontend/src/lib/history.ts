// Saves an activity history entry to Supabase.
// Called after each successful generation in ResumeAnalysisContext.
//
// Each function now takes a `supabase` client as a parameter instead of
// creating its own. This keeps the file as a pure utility (no React hooks)
// while still benefitting from the Clerk-authenticated client created
// in the calling component.

import type { SupabaseClient } from "@supabase/supabase-js";

export type HistoryFeature =
  | "analyze"
  | "cover_letter"
  | "tailored_resume"
  | "mock_interview";

export interface HistoryEntry {
  id: string;
  user_id: string;
  feature: HistoryFeature;
  title: string | null;
  ats_score: number | null | undefined;
  input_data: Record<string, unknown> | null | undefined;
  output_data: Record<string, unknown>;
  created_at: string;
}

export async function saveHistory({
  supabase,
  userId,
  feature,
  title,
  atsScore,
  inputData,
  outputData,
}: {
  supabase: SupabaseClient;
  userId: string;
  feature: HistoryFeature;
  title?: string;
  atsScore?: number | null;
  inputData?: Record<string, unknown>;
  outputData: Record<string, unknown>;
}): Promise<void> {
  try {
    await supabase.from("activity_history").insert({
      user_id:     userId,
      feature,
      title:       title ?? null,
      ats_score:   atsScore ?? null,
      input_data:  inputData ?? null,
      output_data: outputData,
    });
  } catch (err) {
    // History saving is non-critical — never block the main action
    console.error("Failed to save history:", err);
  }
}

export async function loadHistory(
  supabase: SupabaseClient,
  userId: string,
): Promise<HistoryEntry[]> {
  const { data } = await supabase
    .from("activity_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data as HistoryEntry[]) ?? [];
}

export async function deleteHistoryEntry(
  supabase: SupabaseClient,
  id: string,
  userId: string,
): Promise<void> {
  await supabase
    .from("activity_history")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
}