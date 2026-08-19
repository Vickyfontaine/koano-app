-- KOANO migration 009 — archive_coverage integrity fix.
--
-- Problem: the original view SUMMED `written` across runs, so two runs in one
-- week doubled the number — a future reader could not tell a healthy week from a
-- double-run, and the displayed number IS the integrity check.
--
-- Fix: report the UNIQUE rows actually present in the archive for each week, by
-- COUNTING the real tables (not trusting any run's self-reported `written`).
-- This is stronger than "latest run's written": it verifies the data LANDED.
--   * permits (and future archive_snapshots datasets): unique by the table PK
--     (dataset, scope_type, scope_key, captured_week) -> idempotent across runs.
--   * sales: rows carry captured_week = the week first seen, so a week's count is
--     that week's NET-NEW recorded sales (the genesis week holds the whole
--     window; later weeks hold only newly-recorded sales) — a re-run adds nothing.
-- Column renamed rows_written -> rows_present to say what it now means.
--
-- NOTE: Postgres will not RENAME a view column under `create or replace view`
-- (ERROR 42P16), so we DROP first. Safe: nothing in the DB depends on this view
-- (no dependent views/rules/functions); the only consumers are app-side
-- `select *` queries that resolve columns at query time.

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
-- `home` = which table holds a dataset's rows. sales -> sales_archive; every
-- other dataset -> archive_snapshots keyed by `dataset`. Widen this list as new
-- datasets are captured (Slice 2 adds CD + per-property datasets).
ds(dataset, home) as (values ('sales', 'sales_archive'), ('permits', 'archive_snapshots'))
select
  w.week,
  ds.dataset,
  cnt.rows_present,
  (cnt.rows_present = 0) as is_gap
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
