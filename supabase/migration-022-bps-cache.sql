-- migration-022-bps-cache.sql
-- Durable, shared cache for the Census Building Permits Survey (BPS) county read.
--
-- BPS is published as ~1 MB annual per-county TEXT files (one per year, all US
-- counties). Fetching that per verdict on Vercel is the SAME shape as the FHFA
-- /tmp problem that silently rate-blocked cold instances for weeks: /tmp is per-
-- instance and ephemeral, so every cold serverless instance re-downloads. This
-- Supabase-backed cache is SHARED across instances — the 1 MB file is fetched at
-- most once per county per TTL (read-through, on a cache miss), never per verdict.
--
-- Stores the small computed per-county SUPPLY SUMMARY (not the raw file), keyed by
-- state+county FIPS. Long TTL (BPS is annual). Service-role only; no RLS (public
-- Census data keyed by public FIPS, no user data). Same pattern as
-- contamination_cache (migration-020).

create table if not exists public.bps_cache (
  fips_state text not null,
  fips_county text not null,
  data jsonb not null,
  fetched_at timestamptz not null default now(),
  primary key (fips_state, fips_county)
);

comment on table public.bps_cache is
  'Read-through durable cache of the Census Building Permits Survey per-county supply summary. Shared across serverless instances so the ~1 MB annual county file is fetched at most once per county per TTL, never per verdict (fixes the FHFA /tmp cold-start class). Public Census data; service-role only.';
