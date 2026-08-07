-- KOANO migration 004 — Stripe subscription linkage (Phase 3, test mode).
-- Run in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Idempotent; touches nothing in migrations 001–003. No column is dropped.
--
-- Links a Stripe customer/subscription to a KOANO user so the webhook can
-- match lifecycle events by STORED customer id, never by email. plan
-- (migration 003) remains the entitlement field the guard reads; the webhook
-- writes it from these events.

alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text;

-- One Stripe customer per KOANO user; the reliable match key for webhooks.
create unique index if not exists profiles_stripe_customer_id_key
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

-- ---------------------------------------------------------------------------
-- Inspect billing linkage:
--   select email, plan, subscription_status, stripe_customer_id,
--          stripe_subscription_id
--   from public.profiles order by created_at;
--
-- Plan is set automatically by the Stripe webhook. To force a plan manually
-- (as before) without a subscription:
--   update public.profiles set plan = 'community', updated_at = now()
--   where email = 'person@example.com';
-- ---------------------------------------------------------------------------
