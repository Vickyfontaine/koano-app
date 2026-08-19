-- KOANO migration 008 — Archive & Calibration, first slice.
-- Phase 0: the acquisition asset. NYC Open Data is current-state only; nobody
-- stores the time series. These tables capture it append-only so KOANO owns a
-- longitudinal dataset no competitor can retroactively acquire.
--
-- This slice creates the storage for the "irrecoverable five" (starting with
-- sales + tract permits) plus the run ledger and a queryable coverage view.
-- Widening to CDs / per-property / other datasets is ADDITIVE (more rows in
-- archive_snapshots, more datasets in the coverage view) — no re-architecture.
--
-- APPEND-ONLY POLICY: enforced by CONVENTION in the capture code (upsert with
-- ignore-duplicates; the cron never UPDATEs or DELETEs a snapshot). No hard
-- delete-blocking trigger — unlike `verdicts` (a legal audit trail), the archive
-- needs partition maintenance and a self-test harness, both of which a hard
-- trigger would block. archive_runs IS mutable (running -> succeeded).
--
-- SECURITY: RLS enabled with NO policies on every table -> the client (anon /
-- authenticated) is denied; only the service_role (the cron, the harness, the
-- health endpoint) can read/write, and service_role bypasses RLS.
--
-- IRREVERSIBLE DECISIONS BAKED IN HERE (change is ruinous once history exists):
--   * grain = all-NYC tracts + CDs + per-property (this slice: tracts + sales);
--   * cadence = weekly (captured_week = ISO-week Monday);
--   * unique key = (dataset, scope_type, scope_key, captured_week);
--   * monthly RANGE partitioning on captured_week;
--   * capture_version on every row (which capture logic produced it);
--   * live-only provenance (a CHECK enforces it);
--   * tract scope_key = 'BOROUGH:dob_census_tract' (lossless; GEOID joins need a
--     crosswalk — DOB strips the tract code irreversibly).

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ===========================================================================
-- archive_snapshots — STATE snapshots (what did scope X look like this week).
-- Partitioned monthly by captured_week. One row per (dataset, scope, week).
-- ===========================================================================
create table if not exists public.archive_snapshots (
  dataset         text        not null,           -- 'permits' | 'violations' | 'landlord' | 'entitlement' | 'hpi' | 'demographics' | 'zoning'
  scope_type      text        not null,           -- 'tract' | 'community_district' | 'property' | 'metro'
  scope_key       text        not null,           -- 'BOROUGH:census_tract' | CD code | BBL | metro code
  captured_week   date        not null,           -- ISO-week Monday (dedup / gap key / partition key)
  captured_at     timestamptz not null default now(),
  source          text        not null,           -- human-readable provider source
  provenance      text        not null default 'live' check (provenance = 'live'),
  capture_version text        not null,           -- e.g. 'permits-tract@1' — like verdicts.method
  data            jsonb       not null,           -- the metrics (generous; new fields may be added going forward)
  row_count       integer,                        -- underlying record count (sanity: a 0 here is suspicious)
  content_hash    text,                           -- hash of `data` (cheap change detection week-over-week)
  primary key (dataset, scope_type, scope_key, captured_week)
) partition by range (captured_week);

alter table public.archive_snapshots enable row level security;

-- Monthly partitions. Pre-created 2026-08 .. 2027-12; a DEFAULT partition is the
-- safety net so an insert never fails. A future maintenance step (pg_partman or
-- a monthly cron) should add partitions ahead of time; the DEFAULT prevents data
-- loss in the meantime.
create table if not exists public.archive_snapshots_2026_08 partition of public.archive_snapshots for values from ('2026-08-01') to ('2026-09-01');
create table if not exists public.archive_snapshots_2026_09 partition of public.archive_snapshots for values from ('2026-09-01') to ('2026-10-01');
create table if not exists public.archive_snapshots_2026_10 partition of public.archive_snapshots for values from ('2026-10-01') to ('2026-11-01');
create table if not exists public.archive_snapshots_2026_11 partition of public.archive_snapshots for values from ('2026-11-01') to ('2026-12-01');
create table if not exists public.archive_snapshots_2026_12 partition of public.archive_snapshots for values from ('2026-12-01') to ('2027-01-01');
create table if not exists public.archive_snapshots_2027_01 partition of public.archive_snapshots for values from ('2027-01-01') to ('2027-02-01');
create table if not exists public.archive_snapshots_2027_02 partition of public.archive_snapshots for values from ('2027-02-01') to ('2027-03-01');
create table if not exists public.archive_snapshots_2027_03 partition of public.archive_snapshots for values from ('2027-03-01') to ('2027-04-01');
create table if not exists public.archive_snapshots_2027_04 partition of public.archive_snapshots for values from ('2027-04-01') to ('2027-05-01');
create table if not exists public.archive_snapshots_2027_05 partition of public.archive_snapshots for values from ('2027-05-01') to ('2027-06-01');
create table if not exists public.archive_snapshots_2027_06 partition of public.archive_snapshots for values from ('2027-06-01') to ('2027-07-01');
create table if not exists public.archive_snapshots_2027_07 partition of public.archive_snapshots for values from ('2027-07-01') to ('2027-08-01');
create table if not exists public.archive_snapshots_2027_08 partition of public.archive_snapshots for values from ('2027-08-01') to ('2027-09-01');
create table if not exists public.archive_snapshots_2027_09 partition of public.archive_snapshots for values from ('2027-09-01') to ('2027-10-01');
create table if not exists public.archive_snapshots_2027_10 partition of public.archive_snapshots for values from ('2027-10-01') to ('2027-11-01');
create table if not exists public.archive_snapshots_2027_11 partition of public.archive_snapshots for values from ('2027-11-01') to ('2027-12-01');
create table if not exists public.archive_snapshots_2027_12 partition of public.archive_snapshots for values from ('2027-12-01') to ('2028-01-01');
create table if not exists public.archive_snapshots_default partition of public.archive_snapshots default;

-- Time-series index: "give me tract X over time" (the PK already covers it, but
-- an index leading with dataset+scope keeps it fast across partitions).
create index if not exists archive_snapshots_scope_time_idx
  on public.archive_snapshots (dataset, scope_type, scope_key, captured_week desc);

-- ===========================================================================
-- sales_archive — INCREMENTAL accumulation. DOF Rolling Sales is a rolling
-- ~12-month window; sales drop off the source and are gone. We append each
-- recorded sale once (dedup by natural_key) so the permanent record is ours.
-- Small (~50-90k rows/yr) -> not partitioned.
-- ===========================================================================
create table if not exists public.sales_archive (
  id                 uuid        primary key default gen_random_uuid(),
  natural_key        text        not null unique,   -- borough|block|lot|sale_date|sale_price|gsf|class  (dedup)
  bbl                text,                           -- derived borough+block+lot when resolvable
  borough            text,
  block              text,
  lot                text,
  address            text,
  zip                text,
  neighborhood       text,
  building_class     text,                           -- building_class_category
  residential_units  integer,
  gross_square_feet  integer,
  sale_price         bigint,
  sale_date          date        not null,
  captured_at        timestamptz not null default now(),
  captured_week      date        not null,
  source             text        not null,
  capture_version    text        not null            -- e.g. 'sales-incremental@1'
);

alter table public.sales_archive enable row level security;
create index if not exists sales_archive_sale_date_idx on public.sales_archive (sale_date);
create index if not exists sales_archive_bbl_idx on public.sales_archive (bbl);

-- ===========================================================================
-- archive_runs — the failure ledger. One row per cron invocation. A silently
-- broken job that "runs but writes nothing" shows up here as rows_written=0 /
-- status!='succeeded', and in archive_coverage as a gap. archive_runs is
-- MUTABLE (running -> succeeded/partial/failed).
-- ===========================================================================
create table if not exists public.archive_runs (
  id              uuid        primary key default gen_random_uuid(),
  run_week        date        not null,             -- ISO-week Monday this run is for
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  status          text        not null default 'running',  -- running | succeeded | partial | failed
  datasets        jsonb       not null default '{}'::jsonb, -- { permits: {written, error}, sales: {written, error} }
  rows_written    integer     not null default 0,
  capture_version text        not null,
  error           text
);

alter table public.archive_runs enable row level security;
create index if not exists archive_runs_week_idx on public.archive_runs (run_week desc, started_at desc);

-- ===========================================================================
-- archive_coverage — makes GAPS QUERYABLE (principle 4). For every ISO week from
-- the first run to now, and every dataset we capture, report whether a
-- successful run wrote rows. is_gap = a week/dataset with zero written rows.
-- A gap is a SELECT result, never silence. `select * from archive_coverage
-- where is_gap` is the health check.
-- ===========================================================================
create or replace view public.archive_coverage as
with bounds as (
  select
    coalesce(min(run_week), date_trunc('week', now())::date) as first_week,
    date_trunc('week', now())::date as this_week
  from public.archive_runs
),
weeks as (
  select generate_series((select first_week from bounds), (select this_week from bounds), interval '7 days')::date as week
),
ds(dataset) as (values ('sales'), ('permits')),   -- widen this list as datasets are added
written as (
  select r.run_week as week, e.key as dataset, sum(coalesce((e.value->>'written')::int, 0)) as rows_written
  from public.archive_runs r, jsonb_each(r.datasets) e
  where r.status in ('succeeded', 'partial')
  group by r.run_week, e.key
)
select
  w.week,
  ds.dataset,
  coalesce(sum(x.rows_written), 0)::int as rows_written,
  (coalesce(sum(x.rows_written), 0) = 0) as is_gap
from weeks w
cross join ds
left join written x on x.week = w.week and x.dataset = ds.dataset
group by w.week, ds.dataset
order by w.week desc, ds.dataset;
