-- migration-023-ui-sprint-integrity.sql
-- UI-sprint workstream 1 (Phase 0 items 30-6 and 30-17, carried early).
--
-- 1. The provenance CHECK constraints on `verdicts` and `documents` were written
--    for the original two-state model ('live' | 'representative'). Phase 5 made
--    provenance a FIVE-state taxonomy (live | partner | representative |
--    fetch_failed | coverage_absent), so a non-NYC verdict, which correctly rolls
--    up `coverage_absent`, has failed to persist ever since (persist_error was
--    reported, never hidden, but the audit trail still lost the row). Widen both.
-- 2. Persist the verdict's `weighting_breakdown` (the scored math INCLUDING the
--    structural nudge and its drivers). Until now history rows re-derived the
--    math from `agent_summaries` alone, which cannot reproduce the nudge, so a
--    rebuilt history verdict could show a score below the buy threshold next to
--    a BUY. Nullable; persistVerdict degrades gracefully if this is not applied.
-- 3. Enable Row Level Security on the two durable read-through caches that were
--    created without it (contamination_cache, bps_cache). They hold no user data,
--    but every table in the project is RLS-on by rule; the service role (which
--    the providers use) bypasses RLS, so behavior is unchanged.
--
-- Append-only guarantees are untouched: `verdicts` only gains a nullable column.

alter table public.verdicts drop constraint if exists verdicts_overall_provenance_check;
alter table public.verdicts
  add constraint verdicts_overall_provenance_check
  check (overall_provenance in ('live', 'partner', 'representative', 'fetch_failed', 'coverage_absent'));

alter table public.documents drop constraint if exists documents_overall_provenance_check;
alter table public.documents
  add constraint documents_overall_provenance_check
  check (overall_provenance in ('live', 'partner', 'representative', 'fetch_failed', 'coverage_absent'));

alter table public.verdicts add column if not exists weighting_breakdown jsonb;
comment on column public.verdicts.weighting_breakdown is
  'The deterministic verdict math as computed at generation time: per-agent contributions, aggregate score, structural nudge + drivers, final score, thresholds. NULL on rows written before this column existed (the UI re-derives the agent-vote part from agent_summaries and says so).';

alter table if exists public.contamination_cache enable row level security;
alter table if exists public.bps_cache enable row level security;
