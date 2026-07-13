-- KOANO Phase A schema — Step 7.
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- Tables: profiles, properties, verdicts.
-- - verdicts is IMMUTABLE / APPEND-ONLY (trigger blocks UPDATE and DELETE).
-- - Row Level Security is enabled on every table.
-- - Auth model: the app authenticates with Clerk. Server-side writes go through
--   the service role (bypasses RLS by design). Client reads are scoped to the
--   requesting user via koano_requesting_user_id(), which resolves to
--   auth.jwt()->>'sub' (the Clerk user id when Clerk is configured as a
--   third-party auth provider in Supabase) and falls back to auth.uid() for
--   native Supabase sessions. No table is readable without a matching identity.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Identity helper: Clerk user id (JWT sub) or native Supabase auth.uid()
-- ---------------------------------------------------------------------------
create or replace function public.koano_requesting_user_id()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub',
    auth.uid()::text
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles — one row per user, keyed to the Clerk user id
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email text,
  cluster text check (cluster in ('cluster_1', 'cluster_2', 'cluster_4', 'cluster_5')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: select own" on public.profiles;
create policy "profiles: select own"
  on public.profiles for select
  using (clerk_user_id = public.koano_requesting_user_id());

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own"
  on public.profiles for insert
  with check (clerk_user_id = public.koano_requesting_user_id());

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using (clerk_user_id = public.koano_requesting_user_id())
  with check (clerk_user_id = public.koano_requesting_user_id());

-- ---------------------------------------------------------------------------
-- properties — addresses a user tracks
-- ---------------------------------------------------------------------------
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  address_input text not null,
  address_normalized text,
  bbl text,
  bin text,
  tract_geoid text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

create index if not exists properties_clerk_user_id_idx on public.properties (clerk_user_id);
create index if not exists properties_bbl_idx on public.properties (bbl);

alter table public.properties enable row level security;

drop policy if exists "properties: select own" on public.properties;
create policy "properties: select own"
  on public.properties for select
  using (clerk_user_id = public.koano_requesting_user_id());

drop policy if exists "properties: insert own" on public.properties;
create policy "properties: insert own"
  on public.properties for insert
  with check (clerk_user_id = public.koano_requesting_user_id());

drop policy if exists "properties: update own" on public.properties;
create policy "properties: update own"
  on public.properties for update
  using (clerk_user_id = public.koano_requesting_user_id())
  with check (clerk_user_id = public.koano_requesting_user_id());

drop policy if exists "properties: delete own" on public.properties;
create policy "properties: delete own"
  on public.properties for delete
  using (clerk_user_id = public.koano_requesting_user_id());

-- ---------------------------------------------------------------------------
-- verdicts — IMMUTABLE, APPEND-ONLY audit record of every KOANO verdict
-- ---------------------------------------------------------------------------
create table if not exists public.verdicts (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  property_id uuid references public.properties (id),
  address_input text not null,
  address_normalized text,
  bbl text,
  tract_geoid text,
  verdict text not null check (verdict in ('buy', 'sell', 'hold', 'wait', 'drop')),
  confidence integer not null check (confidence between 0 and 100),
  risk_score integer not null check (risk_score between 0 and 100),
  signal_window_months integer not null check (signal_window_months between 1 and 36),
  headline text not null,
  overall_provenance text not null check (overall_provenance in ('live', 'representative')),
  reasoning_chain jsonb not null,
  minority_signals jsonb not null default '[]'::jsonb,
  top_data_sources jsonb not null default '[]'::jsonb,
  agent_summaries jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists verdicts_clerk_user_id_idx on public.verdicts (clerk_user_id, created_at desc);
create index if not exists verdicts_bbl_idx on public.verdicts (bbl);

alter table public.verdicts enable row level security;

drop policy if exists "verdicts: select own" on public.verdicts;
create policy "verdicts: select own"
  on public.verdicts for select
  using (clerk_user_id = public.koano_requesting_user_id());

drop policy if exists "verdicts: insert own" on public.verdicts;
create policy "verdicts: insert own"
  on public.verdicts for insert
  with check (clerk_user_id = public.koano_requesting_user_id());

-- No UPDATE or DELETE policies on verdicts: RLS denies both for regular roles.
-- The trigger below enforces immutability for ALL roles, including service_role.
create or replace function public.koano_verdicts_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'verdicts are immutable / append-only (attempted %)', tg_op;
end;
$$;

drop trigger if exists verdicts_no_update_delete on public.verdicts;
create trigger verdicts_no_update_delete
  before update or delete on public.verdicts
  for each row execute function public.koano_verdicts_immutable();

-- ---------------------------------------------------------------------------
-- Access control + spend guarding (migration 002 — Phase B lockdown)
-- profiles.access_status: access is by approval, not open signup.
-- usage_events: one row per attempted spend; powers per-user rolling-24h
-- rate limits and the global daily circuit breaker (KOANO_DAILY_RUN_CAP).
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists access_status text not null default 'pending'
  check (access_status in ('pending', 'approved', 'denied'));

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
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
-- No insert/update/delete policies: only the service role writes usage.
