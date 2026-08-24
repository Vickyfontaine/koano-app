-- migration-019-verdict-hidden.sql
-- Per-user "hide from view" flags for verdict history. The verdicts table is the
-- append-only, immutable audit trail (a delete/update trigger blocks changes for
-- every role) and STAYS that way. This separate, MUTABLE side table lets a user
-- curate what their history VIEW shows — hide test runs, a mistyped address —
-- without ever touching the record. Hiding is fully reversible (delete the flag).

create table if not exists public.verdict_hidden (
  clerk_user_id text not null,
  verdict_id uuid not null references public.verdicts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (clerk_user_id, verdict_id)
);

create index if not exists verdict_hidden_user_idx on public.verdict_hidden (clerk_user_id);

-- RLS is defense-in-depth: the API uses the service role and scopes every query
-- by clerk_user_id, but a user may only ever see/change their own hide flags.
alter table public.verdict_hidden enable row level security;
drop policy if exists verdict_hidden_owner on public.verdict_hidden;
create policy verdict_hidden_owner on public.verdict_hidden
  for all
  using (clerk_user_id = public.koano_requesting_user_id())
  with check (clerk_user_id = public.koano_requesting_user_id());
