-- KOANO migration 002 — access control + spend guarding (Phase B lockdown).
-- Run in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Idempotent: safe to run more than once.
--
-- 1. profiles.access_status — access is by approval, not open signup.
--    pending (default) | approved | denied. Every money-spending route and
--    /dashboard reject anyone not approved.
-- 2. usage_events — one row per ATTEMPTED spend, written server-side by the
--    service role before any Anthropic call. Powers the per-user rolling-24h
--    rate limits and the global daily circuit breaker (KOANO_DAILY_RUN_CAP).

alter table public.profiles
  add column if not exists access_status text not null default 'pending'
  check (access_status in ('pending', 'approved', 'denied'));

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  -- verdict = five-agent pipeline run (/api/agents, /api/agents/stream);
  -- a Cluster 4 comparison issues one request per site, so 3 sites = 3 rows.
  -- content = generated text (/api/narrative, /api/briefing), shared budget.
  kind text not null check (kind in ('verdict', 'content')),
  route text not null,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_kind_time_idx
  on public.usage_events (clerk_user_id, kind, created_at desc);
create index if not exists usage_events_created_at_idx
  on public.usage_events (created_at desc);

alter table public.usage_events enable row level security;

drop policy if exists "usage_events: select own" on public.usage_events;
create policy "usage_events: select own"
  on public.usage_events for select
  using (clerk_user_id = public.koano_requesting_user_id());
-- No insert/update/delete policies: only the server (service role) writes
-- usage. Clients can read their own usage, never shape it.

-- ---------------------------------------------------------------------------
-- Approving a user (no admin UI by design — run this in the SQL editor):
--
--   update public.profiles
--   set access_status = 'approved', updated_at = now()
--   where email = 'person@example.com';
--
-- To deny instead, set access_status = 'denied'.
-- To see the queue:
--
--   select email, access_status, created_at from public.profiles
--   order by created_at;
-- ---------------------------------------------------------------------------
