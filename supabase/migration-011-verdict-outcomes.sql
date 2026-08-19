-- KOANO migration 011 — verdict_outcomes (Slice 3: calibration scaffolding).
--
-- Records what ACTUALLY happened to a property after a verdict, from public
-- record, so accuracy can be computed later without re-architecting. `verdicts`
-- stays immutable (legal audit trail); outcomes live in their own table.
--
-- ONLY publicly-observable outcomes (be honest about what is measurable):
--   sale                | did it record a sale in the window, at what price/date
--   violation_resolution| change in open HPD violations over the window
--   ownership_change     | registered owner changed
--   permit_disposition   | change in subject-lot DOB filings
-- NOT measurable and NOT modeled: realized return / IRR / rents / occupancy —
-- private. The metric this supports is directional public-signal calibration by
-- confidence bucket, NOT accuracy vs an unseen ground truth.
--
-- `direction` = a favorable-signal marker (+1 favorable / 0 neutral / -1
-- unfavorable) computed where defensible, so calibration is a straight
-- aggregation later: join verdicts x verdict_outcomes, bucket by confidence.
-- One row per (verdict_id, outcome_type): the latest observation (upserted by the
-- weekly scanner as the window plays out).

create table if not exists public.verdict_outcomes (
  id                   uuid        primary key default gen_random_uuid(),
  verdict_id           uuid        not null references public.verdicts (id),
  bbl                  text,
  verdict_created_at   timestamptz not null,
  verdict_value        text        not null,          -- the verdict at the time (buy/hold/wait/...)
  confidence           integer     not null,
  signal_window_months integer     not null,
  window_end           date        not null,          -- verdict_created_at + signal_window_months
  outcome_type         text        not null,          -- sale | violation_resolution | ownership_change | permit_disposition
  observed_at          timestamptz not null default now(),
  within_window        boolean     not null,          -- was the outcome observed on/before window_end
  direction            smallint    not null default 0, -- +1 favorable / 0 neutral / -1 unfavorable
  data                 jsonb       not null,
  source               text        not null,
  provenance           text        not null default 'live',
  capture_version      text        not null,
  created_at           timestamptz not null default now(),
  unique (verdict_id, outcome_type)
);

alter table public.verdict_outcomes enable row level security; -- service-role only (no policies)

create index if not exists verdict_outcomes_verdict_idx on public.verdict_outcomes (verdict_id);
create index if not exists verdict_outcomes_bbl_idx on public.verdict_outcomes (bbl);
create index if not exists verdict_outcomes_calib_idx on public.verdict_outcomes (outcome_type, confidence, direction);
