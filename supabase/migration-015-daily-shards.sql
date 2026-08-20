-- KOANO migration 015 — daily archive fan-out (Phase 2).
--
-- The weekly archive cron processed every tracked property in one Vercel run
-- (~14s/property) and would time out (300s) around ~15 properties — a permanent
-- hole in the compounding archive. The cron now runs DAILY; each day handles one
-- shard (0=Mon..6=Sun) of the properties. All 7 daily runs write the same
-- captured_week (the ISO Monday), so weekly bucketing and the monitoring diff are
-- unchanged.
--
-- This migration:
--   1. adds archive_runs.shard (0..6; NULL for the legacy weekly runs).
--   2. adds a shard-completeness view so gap detection understands the new shape:
--      a week is complete ONLY when all 7 shards ran; a missed DAY is a gap, not
--      "6 of 7 passed". Genesis-guarded to the first SHARDED run so pre-daily
--      weekly runs and first-setup days are never falsely flagged.

alter table public.archive_runs
  add column if not exists shard smallint check (shard is null or (shard between 0 and 6));

-- archive_week_shards — one row per (week, shard) from the first sharded run to
-- now; ran = a succeeded/partial run exists; is_gap = an ELAPSED shard-day (past
-- weeks fully elapsed; current week up to today's shard) at/after genesis that
-- did NOT run. The health endpoint and gap detection read this.
create or replace view public.archive_week_shards as
with genesis as (
  select run_week as first_week, shard as first_shard
  from public.archive_runs
  where status in ('succeeded', 'partial') and shard is not null
  order by run_week asc, shard asc
  limit 1
),
bounds as (
  select
    date_trunc('week', now())::date as this_week,
    (extract(isodow from now())::int - 1) as today_shard  -- 0=Mon..6=Sun
),
weeks as (
  select generate_series((select first_week from genesis), (select this_week from bounds), interval '7 days')::date as week
),
slots as (
  select w.week, s.shard
  from weeks w
  cross join generate_series(0, 6) as s(shard)
)
select
  slots.week,
  slots.shard,
  exists (
    select 1 from public.archive_runs r
    where r.run_week = slots.week and r.shard = slots.shard and r.status in ('succeeded', 'partial')
  ) as ran,
  (
    -- elapsed: past weeks are fully elapsed; the current week only up to today.
    (slots.week < b.this_week or slots.shard <= b.today_shard)
    -- at/after the first sharded run (genesis guard).
    and (slots.week > g.first_week or (slots.week = g.first_week and slots.shard >= g.first_shard))
    -- and no succeeded/partial run for that slot.
    and not exists (
      select 1 from public.archive_runs r
      where r.run_week = slots.week and r.shard = slots.shard and r.status in ('succeeded', 'partial')
    )
  ) as is_gap
from slots
cross join bounds b
cross join genesis g
order by slots.week desc, slots.shard;
