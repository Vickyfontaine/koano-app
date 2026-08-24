// Run-level degradation tracking. A single provider falling back is visible
// per-figure (its representative badge), but nothing told you the RUN AS A WHOLE
// was degraded by SOURCE THROTTLING/TIMEOUT — a fixable infrastructure condition
// (retry, set an API token) — rather than by genuinely unavailable data. This
// request-scoped tracker records exactly that class of failure so a run can say
// "this was degraded by throttling, not a data limit."
//
// Request-scoped via AsyncLocalStorage so concurrent requests never mix, and the
// context propagates through Promise.all (the five agents run in parallel) and
// their nested provider fetches automatically.

import { AsyncLocalStorage } from 'node:async_hooks';

export type DegradationReason = 'timeout' | 'throttle';

export interface DegradationEvent {
  host: string; // the source host that timed out / throttled
  reason: DegradationReason;
}

interface Ctx {
  events: DegradationEvent[];
}

const als = new AsyncLocalStorage<Ctx>();

// Wrap a unit of work; returns its result plus every throttle/timeout degradation
// recorded anywhere beneath it (across parallel agents and their fetches).
export async function runWithDegradationTracking<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; degradations: DegradationEvent[] }> {
  const ctx: Ctx = { events: [] };
  const result = await als.run(ctx, fn);
  return { result, degradations: ctx.events };
}

// Called by the HTTP layer when a live call FAILED (after exhausting retries) for
// a fixable reason. No-op outside a tracked run.
export function recordDegradation(host: string, reason: DegradationReason): void {
  als.getStore()?.events.push({ host, reason });
}

// Collapse raw events into a compact, user-facing summary. Empty → the run was
// not throttle-degraded.
export interface DegradationSummary {
  degraded: boolean;
  timeouts: number;
  throttled: number;
  hosts: string[]; // distinct sources affected
}
export function summarizeDegradations(events: DegradationEvent[]): DegradationSummary {
  const hosts = Array.from(new Set(events.map((e) => e.host)));
  return {
    degraded: events.length > 0,
    timeouts: events.filter((e) => e.reason === 'timeout').length,
    throttled: events.filter((e) => e.reason === 'throttle').length,
    hosts,
  };
}
