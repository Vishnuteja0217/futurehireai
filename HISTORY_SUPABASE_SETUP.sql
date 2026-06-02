-- ============================================================
-- FutureHireAI — Activity History
-- Run this in your Supabase SQL Editor
-- ============================================================

create table if not exists activity_history (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  feature      text not null check (feature in (
                 'analyze', 'cover_letter', 'tailored_resume', 'mock_interview'
               )),
  title        text,             -- short label shown in the list
  ats_score    int,              -- for analyze entries
  input_data   jsonb,            -- job_description snippet
  output_data  jsonb not null,   -- full result stored as JSON
  created_at   timestamptz default now()
);

create index if not exists idx_activity_history_user_id
  on activity_history(user_id);

create index if not exists idx_activity_history_created_at
  on activity_history(created_at desc);

alter table activity_history disable row level security;

-- ============================================================
-- Done! No extra env vars needed — uses the same Supabase
-- keys you already added for the Tracker.
-- ============================================================
