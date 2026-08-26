// Client-safe verdict types + display metadata shared by the verdict UI.
// Type-only re-exports from /lib are erased at compile time — no server code
// (Anthropic SDK, Supabase) ever reaches the client bundle through this file.

export type { DataPoint, Provenance, AddressCandidate } from "../../../lib/providers/types";
export type {
  AgentName,
  KoanoVerdict,
  MinoritySignal,
  ReasoningStep,
  Verdict,
} from "../../../lib/agents/shared";
export type { SynthesisResult, LedgerDataPoint } from "../../../lib/agents/synthesis";
export type { PipelineProgressEvent } from "../../../lib/agents/synthesis";
// Client-safe (no server imports): the pure reconstruction of a persisted
// verdict's math from its stored agent_summaries, + the breakdown type.
export { breakdownFromSummaries } from "../../../lib/agents/breakdown";
export type { WeightingBreakdown, AgentSummary } from "../../../lib/agents/breakdown";
// Client-safe (only imports types): the fact-driven entitlement-risk score, so
// the Cluster 4 panel can show the same factors the agent's score is driven by.
export { deterministicEntitlementRisk } from "../../../lib/agents/entitlement";
export type { EntitlementRisk } from "../../../lib/agents/entitlement";

import type { AgentName, Verdict } from "../../../lib/agents/shared";
import type { Provenance } from "../../../lib/providers/types";

// Display metadata for each of the five provenance states (CLAUDE.md §06). One
// source of truth so every badge/label renders the SAME distinct treatment —
// `live` and `partner` are trusted (green / blue), `representative` and
// `fetch_failed` are amber caveats, `coverage_absent` is a muted structural gap.
export interface ProvenanceMeta {
  label: string;
  color: string;
  background: string;
  note: string; // the explanatory line when a badge shows its note
}
export const PROVENANCE_META: Record<Provenance, ProvenanceMeta> = {
  live: {
    label: "Live",
    color: "var(--signal-positive)",
    background: "rgba(34, 197, 94, 0.08)",
    note: "Fetched live from the source.",
  },
  partner: {
    label: "Partner",
    color: "var(--mid-blue)",
    background: "rgba(90, 155, 190, 0.10)",
    note: "Supplied by a data partner — attributed to the named source, not verified by KOANO.",
  },
  representative: {
    label: "Representative",
    color: "var(--signal-warning)",
    background: "rgba(245, 158, 11, 0.10)",
    note: "Representative stand-in — not fetched live from the source.",
  },
  fetch_failed: {
    label: "Fetch failed",
    color: "var(--signal-warning)",
    background: "rgba(245, 158, 11, 0.10)",
    note: "The live call failed — usually transient; retry to refresh.",
  },
  coverage_absent: {
    label: "Not covered",
    color: "var(--ink-faint)",
    background: "rgba(138, 171, 184, 0.12)",
    note: "Outside KOANO's coverage for this market — no data was queried.",
  },
};

// TRUSTED = carries real present data (live or partner). Use instead of
// `=== 'representative'` for "is this figure fully reliable?" checks, so
// out-of-market / fetch-failed cases are not silently missed. Re-exported from the
// pure shared module (one source of truth with the agents + document renderers).
export { isTrustedProvenance, PROVENANCE_LABEL, weakestProvenance } from "../../../lib/providers/provenance";

// Section 07 agent names, as displayed.
export const AGENT_LABELS: Record<AgentName, string> = {
  "market-timing": "Market Timing",
  infrastructure: "Infrastructure Pipeline",
  "demand-sentiment": "Demand Sentiment",
  "risk-volatility": "Risk & Volatility",
  "regulatory-policy": "Regulatory & Policy",
  synthesis: "Synthesis",
};

export const SPECIALIST_AGENTS: AgentName[] = [
  "market-timing",
  "infrastructure",
  "demand-sentiment",
  "risk-volatility",
  "regulatory-policy",
];

// Signal colors (Section 10) mapped to verdict words.
export const VERDICT_COLORS: Record<Verdict, string> = {
  buy: "var(--signal-positive)",
  sell: "var(--signal-negative)",
  drop: "var(--signal-negative)",
  hold: "var(--mid-blue)",
  wait: "var(--signal-warning)",
};

// Which paid integration turns a representative source live (Section 14 —
// mirrors the swap_note on each mock provider). Matched against DataPoint /
// ReasoningStep source strings. Order matters: most specific first.
const SWAP_INTEGRATIONS: Array<{ match: RegExp; integration: string }> = [
  { match: /representative institutional comps/i, integration: "CoStar / MSCI Real Capital Analytics" },
  { match: /representative comps/i, integration: "MLS (Trestle) / ATTOM" },
  { match: /representative hazard/i, integration: "First Street premium hazard" },
  { match: /representative foot-traffic/i, integration: "Placer.ai" },
  { match: /representative benchmarks/i, integration: "CoStar Market Analytics" },
];

// Given the source names behind a representative figure, name the integration
// that makes it live — or null when it's a live-source fallback (no paid swap).
export function swapIntegrationFor(sources: string[]): string | null {
  for (const s of sources) {
    for (const { match, integration } of SWAP_INTEGRATIONS) {
      if (match.test(s)) return integration;
    }
  }
  return null;
}
