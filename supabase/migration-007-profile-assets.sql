-- KOANO migration 007 — profile-assets Storage bucket (white-label documents).
-- Run in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Idempotent: safe to run more than once. Does NOT touch migrations 001–006.
--
-- Stores users' logo / headshot for white-labeled document letterheads.
-- PUBLIC-READ by design: these are branding assets embedded in forwardable
-- documents (PDFs that leave the product) and shown in the settings preview,
-- so they need stable, non-expiring URLs — not sensitive, not signed-URL.
--
-- Uploads are server-proxied: the Clerk-protected /api/profile/asset route
-- validates and writes with the SERVICE ROLE (which bypasses RLS), scoping each
-- object to the path `{clerk_user_id}/{kind}`. The RLS policies below are
-- defense-in-depth for any future direct client write — they restrict
-- write/update/delete to a user's own folder via the same Clerk-JWT helper
-- (koano_requesting_user_id()) used by every other table.

-- 1. The bucket (public-read).
insert into storage.buckets (id, name, public)
values ('profile-assets', 'profile-assets', true)
on conflict (id) do update set public = excluded.public;

-- 2. RLS policies on storage.objects, scoped to this bucket + the owner's
--    top-level folder (path = '{clerk_user_id}/...', so foldername[1] = uid).

drop policy if exists "profile-assets: public read" on storage.objects;
create policy "profile-assets: public read"
  on storage.objects for select
  using (bucket_id = 'profile-assets');

drop policy if exists "profile-assets: owner insert" on storage.objects;
create policy "profile-assets: owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-assets'
    and (storage.foldername(name))[1] = public.koano_requesting_user_id()
  );

drop policy if exists "profile-assets: owner update" on storage.objects;
create policy "profile-assets: owner update"
  on storage.objects for update
  using (
    bucket_id = 'profile-assets'
    and (storage.foldername(name))[1] = public.koano_requesting_user_id()
  );

drop policy if exists "profile-assets: owner delete" on storage.objects;
create policy "profile-assets: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'profile-assets'
    and (storage.foldername(name))[1] = public.koano_requesting_user_id()
  );

-- ---------------------------------------------------------------------------
-- Public URL shape (stored on profiles.logo_url / headshot_url):
--   {SUPABASE_URL}/storage/v1/object/public/profile-assets/{clerk_user_id}/{kind}
-- The server route appends a cache-busting ?v=<timestamp> when it replaces one.
-- ---------------------------------------------------------------------------
