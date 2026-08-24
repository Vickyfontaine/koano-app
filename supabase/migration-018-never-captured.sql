-- KOANO migration 018 — make a NEVER-CAPTURED dataset a visible gap, not silence.
--
-- The hole (found via the FHFA/HPI finding): archive_coverage only enumerates the
-- WEEKLY datasets. The capture-if-changed datasets (hpi, zoning, disaster_history,
-- mortgage_demand, employment, comp_zip) are deliberately excluded from the weekly
-- gap check — a no-change week is legitimately empty. But that exclusion means a
-- dataset that has NEVER captured a single row is indistinguishable from one that
-- is simply not due, so it never surfaces. HPI sat at zero rows unnoticed for
-- exactly this reason.
--
-- This view checks ALL-TIME presence for EVERY expected dataset (weekly AND
-- capture-if-changed). never_captured = zero rows across all history, with two
-- guards so it can't false-alarm:
--   * genesis: only meaningful once the archive has actually run (a brand-new
--     install legitimately has nothing yet).
--   * needs_properties: a per-property/derived dataset with zero rows is only a
--     gap when at least one property is tracked (mirrors archive_coverage).
-- Staleness of capture-if-changed datasets (captured once, now overdue) remains a
-- separate, later cadence-aware check; this closes the never-captured case.

create or replace view public.archive_never_captured as
with genesis as (
  select exists (
    select 1 from public.archive_runs where status in ('succeeded', 'partial')
  ) as started
),
props as (select (count(*) > 0) as any_tracked from public.properties),
-- (dataset, home table, needs_properties). The COMPLETE expected set — weekly and
-- capture-if-changed alike. needs_properties = per-property or derived-from-tracked
-- (violations/landlord/filings/zoning/contamination/comp_zip and the county
-- national datasets); all-NYC/metro datasets (permits/entitlement_cd/hpi/sales) do
-- not need a tracked property to capture.
ds(dataset, home, needs_properties) as (values
  ('sales',            'sales_archive',     false),
  ('permits',          'archive_snapshots', false),
  ('entitlement_cd',   'archive_snapshots', false),
  ('hpi',              'archive_snapshots', false),
  ('violations',       'archive_snapshots', true),
  ('landlord',         'archive_snapshots', true),
  ('filings',          'archive_snapshots', true),
  ('zoning',           'archive_snapshots', true),
  ('contamination',    'archive_snapshots', true),
  ('disaster_history', 'archive_snapshots', true),
  ('mortgage_demand',  'archive_snapshots', true),
  ('employment',       'archive_snapshots', true),
  ('comp_zip',         'archive_snapshots', true)
)
select
  ds.dataset,
  cnt.total_rows,
  (
    cnt.total_rows = 0
    and (select started from genesis)
    and (not ds.needs_properties or (select any_tracked from props))
  ) as never_captured
from ds
cross join lateral (
  select (
    case
      when ds.home = 'sales_archive' then (select count(*) from public.sales_archive)
      else (select count(*) from public.archive_snapshots a where a.dataset = ds.dataset)
    end
  )::int as total_rows
) cnt
order by never_captured desc, ds.dataset;
