-- KOANO migration 016 — properties.zip (Phase 2 monitoring, Slice 4).
--
-- Monitoring fans a per-ZIP comp-price change out to every monitored property in
-- that ZIP, and a per-county disaster change to every property in that county.
-- County is derivable (left(tract_geoid,5)), but ZIP was not stored — add it.
-- New properties populate it on insert; existing rows backfill on their next
-- archive capture (the cron updates zip when it resolves the address).

alter table public.properties
  add column if not exists zip text;

create index if not exists properties_zip_idx on public.properties (zip);
-- county lookups use the tract_geoid prefix; index it for the fan-out query.
create index if not exists properties_tract_idx on public.properties (tract_geoid);
