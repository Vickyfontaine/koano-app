-- migration-021-verdict-method-era.sql
-- Persist the verdict-engine markers on each verdict, so the calibration record
-- can distinguish verdicts by HOW they were computed and WHAT inputs existed.
--
-- migration-008 already referenced `verdicts.method` in a comment ("like
-- verdicts.method"), but the column was never added — the marker was persisted
-- nowhere. This adds it, plus `inputs_era` (the §07C inputs-era boundary), which
-- Phase 5 Slice 3 moves to 'v2-federal-risk-supply' when the FEMA National Risk
-- Index (and, in the same expansion, HUD QCT/DDA + Census Building Permits Survey)
-- become verdict inputs.
--
-- Both are NULLABLE: rows written before this migration keep NULL (they belong to
-- the pre-marker era 1), and persistVerdict fails GRACEFULLY if this is not yet
-- applied (the verdict is still returned to the caller; persist_error is reported,
-- never hidden), so deploy ordering cannot break the verdict path. The verdicts
-- table stays append-only/immutable; this only adds columns.

alter table public.verdicts add column if not exists method text;
alter table public.verdicts add column if not exists inputs_era text;

comment on column public.verdicts.method is
  'Aggregation methodology marker (e.g. "confidence-weighted v1") — how the agent votes were combined.';
comment on column public.verdicts.inputs_era is
  'Verdict-engine INPUTS era (e.g. "v2-federal-risk-supply") — what evidence existed when produced. NULL = pre-marker era 1. Used to bucket the calibration record.';
