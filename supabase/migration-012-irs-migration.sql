-- KOANO migration 012 — irs_migration (Phase 1, Demand-Sentiment).
--
-- IRS SOI county-to-county migration has NO live API (bulk annual CSVs only), so
-- KOANO self-hosts a small per-county aggregate ingested once from the IRS files
-- (see scripts/ingest-irs-migration.ts). The provider reads this table and tags
-- the result `live` with the vintage — the data IS the authoritative IRS figure,
-- just annually published (same treatment as ACS/FHFA). When this table is empty
-- the provider omits the signal (never representative), so demand stays live on
-- HMDA + QCEW alone.
--
-- One row per (county, vintage): total in/out migration returns (~households) and
-- the aggregate AGI of movers (in thousands of dollars, as IRS publishes it).

create table if not exists public.irs_migration (
  fips_state           text   not null,          -- 2-digit state FIPS
  fips_county          text   not null,          -- 3-digit county FIPS
  vintage              text   not null,          -- e.g. '2021-2022' (the 2223 file)
  inflow_returns       integer,                  -- households moving IN (sum n1)
  inflow_agi_thousands bigint,                   -- aggregate AGI of in-movers ($000)
  outflow_returns      integer,                  -- households moving OUT
  outflow_agi_thousands bigint,                  -- aggregate AGI of out-movers ($000)
  updated_at           timestamptz not null default now(),
  primary key (fips_state, fips_county, vintage)
);

alter table public.irs_migration enable row level security; -- service-role only (no policies)
