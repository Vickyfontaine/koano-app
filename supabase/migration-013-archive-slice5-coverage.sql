-- KOANO migration 013 — widen archive_coverage for Slice 5 (national providers).
--
-- Phase 1 added EPA contamination proximity to the weekly per-property capture,
-- so it joins the gap check as a needs_properties dataset (same as violations/
-- landlord/filings): a gap only when tracked properties exist.
--
-- The other three national datasets — disaster_history, mortgage_demand (HMDA),
-- employment (QCEW) — are CAPTURE-IF-CHANGED at county grain (disaster
-- declarations irregular, HMDA annual, QCEW quarterly). Like hpi/zoning they are
-- deliberately NOT in this weekly view: a week with no change is not a gap. A
-- cadence-aware freshness check for the capture-if-changed datasets is a later task.
--
-- DROP first (a create-or-replace view cannot change the column set); nothing in
-- the DB depends on this view.

drop view if exists public.archive_coverage;
create view public.archive_coverage as
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
  ('filings',        'archive_snapshots', true),
  ('contamination',  'archive_snapshots', true)
),
props as (select (count(*) > 0) as any_tracked from public.properties)
select
  w.week,
  ds.dataset,
  cnt.rows_present,
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
