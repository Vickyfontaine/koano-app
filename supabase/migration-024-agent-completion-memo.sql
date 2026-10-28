-- migration-024-agent-completion-memo.sql
-- Identical inputs give an identical decision (Phase 0).
--
-- The five specialist agents run at temperature 0 but the model still varies run
-- to run on identical inputs (425 6th St, 2026-10-23: 41 runs scored 68 to 80 as
-- Demand Sentiment flipped HOLD <-> WAIT). lib/agents/completion-memo.ts keeps
-- the first completion for an exact request (SHA-256 of model, temperature,
-- system prompt and messages) and reuses it, so the same public record and the
-- same code always produce the same verdict and confidence. This table shares
-- that memo across serverless instances. Until it exists the code memoizes per
-- instance only.
--
-- Contents: the model's raw JSON reply to a prompt built from public-record data
-- points. No user data. Service-role only (RLS on, no policies).

create table if not exists public.agent_completion_memo (
  key text primary key,
  agent text not null,
  model text not null,
  completion text not null,
  created_at timestamptz not null default now()
);

alter table public.agent_completion_memo enable row level security;

comment on table public.agent_completion_memo is
  'First temperature-0 completion per exact agent request (SHA-256 key), reused so identical inputs give an identical decision. Public-record prompts only; service-role only.';
