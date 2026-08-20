-- KOANO migration 014 — scheduled monitoring (Phase 2, Slice 1: schema).
--
-- Monitoring is the DIFF on top of the weekly archive: it re-checks tracked
-- properties, compares this week's snapshot to the prior one, and records a
-- notification per material change. Detection is deterministic (no model call,
-- no verdict/content allowance). These tables hold preferences, the notification
-- feed / delivery history, and a per-run observability ledger.
--
-- INTEGRITY: `before_value` / `after_value` / `data` hold ONLY values lifted
-- verbatim from archive snapshots — the diff engine cannot write inference or
-- interpretation into them (enforced in code by pure snapshot→Change functions
-- and fixed title/body templates). Same discipline as the grounding gate.
--
-- Convention matches `properties`: user column is `clerk_user_id text`, RLS via
-- public.koano_requesting_user_id(); the cron writes with the service role
-- (bypasses RLS); the client reads/updates its own rows via policy.

-- --- per-property watch toggle (no new table) -------------------------------
alter table public.properties
  add column if not exists monitoring_enabled boolean not null default true;

-- --- monitoring_preferences (one row per user) ------------------------------
create table if not exists public.monitoring_preferences (
  clerk_user_id      text        primary key,
  email_enabled      boolean     not null default true,
  inapp_enabled      boolean     not null default true,
  frequency          text        not null default 'weekly' check (frequency in ('weekly', 'off')),
  muted_signal_types text[]      not null default '{}',   -- e.g. {'comp_price'}
  min_severity       text        not null default 'material' check (min_severity in ('info', 'material', 'high')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.monitoring_preferences enable row level security;

drop policy if exists "monitoring_preferences: select own" on public.monitoring_preferences;
create policy "monitoring_preferences: select own"
  on public.monitoring_preferences for select
  using (clerk_user_id = public.koano_requesting_user_id());

drop policy if exists "monitoring_preferences: insert own" on public.monitoring_preferences;
create policy "monitoring_preferences: insert own"
  on public.monitoring_preferences for insert
  with check (clerk_user_id = public.koano_requesting_user_id());

drop policy if exists "monitoring_preferences: update own" on public.monitoring_preferences;
create policy "monitoring_preferences: update own"
  on public.monitoring_preferences for update
  using (clerk_user_id = public.koano_requesting_user_id())
  with check (clerk_user_id = public.koano_requesting_user_id());

-- --- notifications (in-app feed + email delivery history) --------------------
-- One row per (user, property, signal_type, captured_week): each notification
-- SUMMARIZES that signal's change for the week (per-class deltas live in `data`),
-- which keeps the digest one-line-per-signal AND makes a cron re-run idempotent.
create table if not exists public.notifications (
  id            uuid        primary key default gen_random_uuid(),
  clerk_user_id text        not null,
  property_id   uuid        references public.properties (id) on delete cascade,
  bbl           text,
  signal_type   text        not null check (signal_type in (
                  'permit', 'violation_new', 'violation_resolved', 'ownership_change',
                  'verdict_data_change', 'contamination', 'disaster', 'comp_price')),
  severity      text        not null check (severity in ('info', 'material', 'high')),
  title         text        not null,   -- rendered from a fixed template + literal snapshot values
  body          text        not null,   -- rendered from a fixed template + literal snapshot values
  before_value  text,                   -- literal value read from the PRIOR snapshot
  after_value   text,                   -- literal value read from the CURRENT snapshot
  data          jsonb       not null default '{}',  -- structured detail, fields lifted verbatim from snapshots
  captured_week date        not null,
  link_path     text,                   -- deep link back into the app
  channels_sent text[]      not null default '{}',
  email_status  text        check (email_status in ('sent', 'failed', 'skipped', 'pending')),
  read_at       timestamptz,
  created_at    timestamptz not null default now(),
  unique (clerk_user_id, property_id, signal_type, captured_week)
);

create index if not exists notifications_feed_idx on public.notifications (clerk_user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (clerk_user_id) where read_at is null;
create index if not exists notifications_property_idx on public.notifications (property_id);

alter table public.notifications enable row level security;

drop policy if exists "notifications: select own" on public.notifications;
create policy "notifications: select own"
  on public.notifications for select
  using (clerk_user_id = public.koano_requesting_user_id());

-- Client may only flip read_at on its own rows (mark-as-read). Inserts are
-- service-role only (the cron) — no insert policy, so RLS denies client inserts.
drop policy if exists "notifications: update own" on public.notifications;
create policy "notifications: update own"
  on public.notifications for update
  using (clerk_user_id = public.koano_requesting_user_id())
  with check (clerk_user_id = public.koano_requesting_user_id());

-- --- monitor_runs (observability ledger; service-role only, like archive_runs) ---
create table if not exists public.monitor_runs (
  id                    uuid        primary key default gen_random_uuid(),
  run_week              date        not null,
  started_at            timestamptz not null default now(),
  finished_at           timestamptz,
  properties_checked    integer,
  changes_detected      integer,
  notifications_created integer,
  emails_sent           integer,
  status                text        not null default 'running',  -- running|succeeded|partial|failed
  error                 text
);

alter table public.monitor_runs enable row level security; -- service-role only (no policies)
