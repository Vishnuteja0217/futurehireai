-- ============================================================
-- FutureHireAI — Job Application Tracker
-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- 1. Create the table
create table if not exists job_applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,          -- Clerk user ID
  company       text not null,
  role          text not null,
  url           text,
  date_applied  date not null,
  status        text not null default 'applied'
                  check (status in (
                    'applied','phone_screen','interviewing',
                    'offer','rejected','withdrawn','ghosted'
                  )),
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 2. Index for fast per-user queries
create index if not exists idx_job_applications_user_id
  on job_applications(user_id);

-- 3. Enable Row Level Security
alter table job_applications enable row level security;

-- 4. RLS policy — users can only see/edit their own rows
create policy "Users manage own applications"
  on job_applications
  for all
  using  (user_id = requesting_user_id())
  with check (user_id = requesting_user_id());

-- ── NOTE ────────────────────────────────────────────────────────────────────
-- Because this app uses Clerk (not Supabase Auth), RLS uses the anon key
-- and we filter by user_id in every query.
--
-- For tighter security later, you can integrate Clerk JWT with Supabase:
-- https://clerk.com/docs/integrations/databases/supabase
--
-- For now, the simpler approach: disable RLS and rely on server-side
-- user_id filtering (the queries always include .eq("user_id", user.id)).
-- Run this instead if the RLS policy above causes issues:
-- ────────────────────────────────────────────────────────────────────────────

-- ALTERNATIVE (simpler, no RLS):
-- alter table job_applications disable row level security;

-- ============================================================
-- Done! Now add these to your Vercel environment variables:
--   NEXT_PUBLIC_SUPABASE_URL      → from Supabase Project Settings → API
--   NEXT_PUBLIC_SUPABASE_ANON_KEY → from Supabase Project Settings → API
-- ============================================================
