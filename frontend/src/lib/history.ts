// Saves an activity history entry to Supabase.
// Called after each successful generation in ResumeAnalysisContext.

import { getSupabase } from "./supabase";

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
  userId,
  feature,
  title,
  atsScore,
  inputData,
  outputData,
}: {
  userId: string;
  feature: HistoryFeature;
  title?: string;
  atsScore?: number | null;
  inputData?: Record<string, unknown>;
  outputData: Record<string, unknown>;
}): Promise<void> {
  try {
    await getSupabase().from("activity_history").insert({
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

export async function loadHistory(userId: string): Promise<HistoryEntry[]> {
  const { data } = await getSupabase()
    .from("activity_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data as HistoryEntry[]) ?? [];
}

export async function deleteHistoryEntry(id: string, userId: string): Promise<void> {
  await getSupabase()
    .from("activity_history")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
}
