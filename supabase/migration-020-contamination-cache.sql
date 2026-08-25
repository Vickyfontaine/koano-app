-- migration-020-contamination-cache.sql
-- Per-BBL cache for EPA contamination. The EPA FRS enforces 12 requests/minute;
-- three concurrent site analyses each fire SEMS + ACRES, which throttled and
-- fell back. But contamination proximity BARELY CHANGES (Superfund/brownfield
-- designations move on a multi-year cadence), so it is ideal to cache: the EPA
-- is queried once per building, then served from here — concurrent and repeat
-- runs make ZERO EPA calls.
--
-- Keyed by BBL (a stable NYC building identifier). Non-NYC / null-BBL points
-- aren't cached (they call live). Service-role only; no RLS needed (it holds no
-- user data — just public EPA facts keyed by a public lot id).

create table if not exists public.contamination_cache (
  bbl text primary key,
  data jsonb not null,
  fetched_at timestamptz not null default now()
);
