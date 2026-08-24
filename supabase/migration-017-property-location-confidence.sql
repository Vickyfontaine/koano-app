-- migration-017-property-location-confidence.sql
-- Carry coordinate confidence onto tracked properties so the Cluster 5 portfolio
-- risk map can flag a holding whose location was resolved WITHOUT a cross-check.
-- A portfolio pin in the wrong place is the same failure as the 175-3rd-St
-- mis-resolution (see the geocode guard fix), at portfolio scale.
--
-- Nullable: existing rows predate ResolvedAddress.location_confidence and never
-- captured it, so they read as NULL — the UI treats NULL as "location unverified"
-- (not a confident pin) until the property is re-added, which now writes it.
-- The GET/POST route degrades gracefully if this migration has not been applied
-- yet (a bad build-deploy order can never break the portfolio load).

alter table if exists public.properties
  add column if not exists location_confidence text;

-- Values are 'confirmed' | 'unconfirmed' (or NULL for pre-migration rows).
-- No CHECK constraint: a future confidence tier must not require a schema change.
