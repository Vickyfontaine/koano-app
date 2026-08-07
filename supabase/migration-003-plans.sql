-- KOANO migration 003 — tier-based access (Phase 2 of the paywall migration).
-- Run in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Idempotent: safe to run more than once. Does NOT touch migrations 001/002.
--
-- Converts access from approval-based to tier-based:
-- - profiles.plan is the new gate. Default 'free' (3 lifetime verdict runs +
--   3 lifetime content generations, so a new user can preview the engine).
--   Paid plans get rolling-24h limits enforced in lib/koano-guard.ts.
-- - profiles.access_status is KEPT for now (Stripe/upgrade-screen phases will
--   revisit it) but is no longer read as a gate. No column is dropped.

alter table public.profiles
  add column if not exists plan text not null default 'free'
  check (plan in ('free', 'community', 'transaction', 'development', 'portfolio'));

-- ---------------------------------------------------------------------------
-- Upgrading a user (no Stripe yet — run this in the SQL editor):
--
--   update public.profiles
--   set plan = 'community', updated_at = now()
--   where email = 'person@example.com';
--
-- Valid plans: free | community | transaction | development | portfolio.
-- Downgrade to free the same way. A user's usage_events history is left
-- intact on plan change; paid limits count only the rolling 24h window, so
-- pre-upgrade free usage ages out and never permanently blocks a paid user.
--
-- Current tiers:
--
--   select email, plan, access_status, created_at from public.profiles
--   order by created_at;
-- ---------------------------------------------------------------------------
