// Provenance logic — the rollup + trust helpers, in ONE pure, client-safe place
// (only imports the Provenance type — no Anthropic SDK, no Supabase), so the
// agents (server), the document renderers (server), and the dashboard UI (client)
// all share the same taxonomy semantics and can never drift.
//
// The five states and WHY the ordering is what it is: see the Provenance type in
// ./types. A labeled stand-in is wrong-but-inspectable, so ABSENCE (no data to
// evaluate) is a louder caveat than `representative`; and STRUCTURAL absence
// (coverage_absent) outranks TRANSIENT (fetch_failed). `partner` sits just below
// `live`, so a mostly-live run with one partner figure rolls up `partner`
// (attributed), never collapsing to `representative`.

import type { Provenance } from './types';

export const PROVENANCE_SEVERITY: Record<Provenance, number> = {
  live: 0,
  partner: 1,
  representative: 2,
  fetch_failed: 3,
  coverage_absent: 4,
};

// The OVERALL provenance of a set of inputs = the weakest (highest severity). An
// empty set, or an all-live set, rolls up `live` — so a pure-live verdict is
// unaffected by the taxonomy.
export function weakestProvenance(points: { provenance: Provenance }[]): Provenance {
  return points.reduce<Provenance>(
    (worst, p) => (PROVENANCE_SEVERITY[p.provenance] > PROVENANCE_SEVERITY[worst] ? p.provenance : worst),
    'live',
  );
}

// TRUSTED = carries real, present data (live or partner). The other three are
// caveats: a stand-in, a failed fetch, or an uncovered market. Use this instead
// of `=== 'representative'` for "is this figure fully reliable?" checks, so
// out-of-market / fetch-failed cases are never silently missed.
export function isTrustedProvenance(p: Provenance): boolean {
  return p === 'live' || p === 'partner';
}

// Plain-text label for prose / documents (the UI badge uses PROVENANCE_META,
// which additionally carries colors).
export const PROVENANCE_LABEL: Record<Provenance, string> = {
  live: 'live',
  partner: 'partner-sourced',
  representative: 'representative',
  fetch_failed: 'fetch failed',
  coverage_absent: 'not covered',
};
