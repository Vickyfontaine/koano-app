-- KOANO migration 010 — widen archive_coverage for Slice 2 datasets.
--
-- Adds the new WEEKLY datasets to the gap check: entitlement_cd (all NYC CDs)
-- and the per-property datasets (violations, landlord, filings). Same
-- count-the-tables integrity as migration-009.
--
-- Two cadence rules encoded here:
--   * Property datasets are a gap ONLY when tracked properties exist. With an
--     empty `properties` table there is nothing to capture, so 0 rows is correct,
--     not a gap (`needs_properties`).
--   * hpi and zoning are CAPTURE-IF-CHANGED (quarterly / on version bump), so they
--     are deliberately NOT in this weekly view — a week without a zoning bump is
--     not a gap. A cadence-aware freshness check for those is a later task.

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
-- (dataset, home table, needs_properties). Widen as new WEEKLY datasets ship.
ds(dataset, home, needs_properties) as (values
  ('sales',          'sales_archive',     false),
  ('permits',        'archive_snapshots', false),
  ('entitlement_cd', 'archive_snapshots', false),
  ('violations',     'archive_snapshots', true),
  ('landlord',       'archive_snapshots', true),
  ('filings',        'archive_snapshots', true)
),
props as (select (count(*) > 0) as any_tracked from public.properties)
select
  w.week,
  ds.dataset,
  cnt.rows_present,
  -- gap = nothing landed AND we actually expected something this week
  (cnt.rows_present = 0 and (not ds.needs_properties or (select any_tracked from props))) as is_gap
from weeks w
cross join ds
cross join lateral (
  select (
    case
      when ds.home = 'sales_archive'
        then (select count(*) from public.sales_archive s where s.captured_week = w.week)
      else (select count(*) from public.archive_snapshots a where a.dataset = ds.dataset and a.captured_week = w.week)
    end
  )::int as rows_present
) cnt
order by w.week desc, ds.dataset;
