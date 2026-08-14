-- KOANO migration 005 — profile letterhead fields (document engine, Slice 1).
-- Run in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Idempotent: safe to run more than once. Does NOT touch migrations 001–004.
--
-- Adds the professional-identity fields that auto-fill a generated document's
-- letterhead / signature block (CMA, IC memo, tax-appeal packet, etc.). Every
-- field is nullable: a document renders without them (they simply omit that
-- line), so this never blocks generation. logo_url / headshot_url are Supabase
-- Storage URLs, populated later; v1 documents render text-only without them.

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists company_name text,
  add column if not exists license_number text,   -- broker / appraiser license, printed as-entered
  add column if not exists phone text,
  add column if not exists contact_email text,     -- distinct from account `email` (Clerk login)
  add column if not exists logo_url text,           -- Supabase Storage; v2 image embed
  add column if not exists headshot_url text;        -- Supabase Storage; v2 image embed

-- ---------------------------------------------------------------------------
-- These are user-editable profile fields (a settings form writes them via the
-- existing "profiles: update own" RLS policy — no new policy needed). The
-- document assembler reads them server-side to fill the letterhead; a null
-- field is simply omitted from the rendered document, never shown blank.
-- ---------------------------------------------------------------------------
