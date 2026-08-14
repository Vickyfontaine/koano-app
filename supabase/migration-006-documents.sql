-- KOANO migration 006 — documents table (document engine, Slice 1).
-- Run in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Idempotent: safe to run more than once. Does NOT touch migrations 001–005.
--
-- One row per generated document. The table is deliberately triple-purpose:
--   1. Audit trail — an immutable record of every deliverable KOANO produced,
--      its type, tier, provenance, and how it was built. Append-only, like
--      verdicts, and for the same reason: a generated document is a claim the
--      user may act on, so the record of it must not be silently rewritten.
--   2. Cap counter — the per-user rolling-24h document limit
--      (KOANO_DAILY_DOCUMENT_CAP, default ~30) is a COUNT over this table, so
--      no separate counter table or usage_events row is needed. Both free
--      ("from my last analysis") and fresh generations write a row and count.
--   3. v2 re-download index — file_url is null in v1 (documents stream once);
--      v2 populates it with a Supabase Storage path for re-download.
--
-- v1 stores METADATA ONLY — no document bytes. file_url stays null until v2.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  property_id uuid references public.properties (id),
  verdict_id uuid references public.verdicts (id),   -- set when built from a stored verdict
  doc_type text not null,                             -- document registry key, e.g. 'tax_appeal_packet'
  tier text not null check (tier in ('community', 'transaction', 'development', 'portfolio')),
  format text not null check (format in ('pdf', 'docx')),
  build_source text not null check (build_source in ('verdict', 'fresh')),  -- verdict = 0 content generations
  title text not null,
  address_input text,                                 -- snapshot for the audit trail
  overall_provenance text not null check (overall_provenance in ('live', 'representative')),
  file_url text,                                       -- null in v1; Supabase Storage path in v2
  created_at timestamptz not null default now()
);

-- Powers both the rolling-24h cap COUNT and the user's document history list.
create index if not exists documents_user_time_idx
  on public.documents (clerk_user_id, created_at desc);

alter table public.documents enable row level security;

drop policy if exists "documents: select own" on public.documents;
create policy "documents: select own"
  on public.documents for select
  using (clerk_user_id = public.koano_requesting_user_id());

drop policy if exists "documents: insert own" on public.documents;
create policy "documents: insert own"
  on public.documents for insert
  with check (clerk_user_id = public.koano_requesting_user_id());

-- No UPDATE or DELETE policies: RLS denies both for regular roles. The trigger
-- below enforces append-only immutability for ALL roles, including
-- service_role — identical discipline to the verdicts table. (v2 re-download
-- sets file_url at INSERT time, so immutability does not block it.)
create or replace function public.koano_documents_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'documents are immutable / append-only (attempted %)', tg_op;
end;
$$;

drop trigger if exists documents_no_update_delete on public.documents;
create trigger documents_no_update_delete
  before update or delete on public.documents
  for each row execute function public.koano_documents_immutable();
