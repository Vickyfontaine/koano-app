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
export type ProvenanceGlyph = "solid" | "diamond" | "hatched" | "dashed" | "cut";
export interface ProvenanceMeta {
  label: string;
  /** TEXT color for the label: an AA ink token (5:1+ on white). */
  color: string;
  /** FILL hue for the dot / glyph (the saturated signal color). */
  fill: string;
  background: string;
  /** Non-color cue so a state never depends on hue alone (A16). */
  glyph: ProvenanceGlyph;
  note: string; // the explanatory line when a badge shows its note
}
export const PROVENANCE_META: Record<Provenance, ProvenanceMeta> = {
  live: {
    label: "Live",
    color: "var(--signal-positive-ink)",
    fill: "var(--signal-positive)",
    background: "var(--signal-positive-tint)",
    glyph: "solid",
    note: "Fetched live from the source.",
  },
  partner: {
    label: "Partner",
    color: "var(--mid-blue-ink)",
    fill: "var(--mid-blue)",
    background: "rgba(90, 155, 190, 0.12)",
    glyph: "diamond",
    note: "Supplied by a data partner. Attributed to the named source, not verified by KOANO.",
  },
  representative: {
    label: "Representative",
    color: "var(--signal-warning-ink)",
    fill: "var(--signal-warning)",
    background: "var(--signal-warning-tint)",
    glyph: "hatched",
    note: "Representative stand-in. Not fetched live from the source.",
  },
  fetch_failed: {
    label: "Fetch failed",
    color: "var(--signal-warning-ink)",
    fill: "var(--signal-warning)",
    background: "var(--signal-warning-tint)",
    glyph: "dashed",
    note: "The live call failed. Usually transient; retry to refresh.",
  },
  coverage_absent: {
    label: "Not covered",
    color: "var(--ink-muted)",
    fill: "var(--ink-faint)",
    background: "rgba(110, 142, 157, 0.12)",
    glyph: "cut",
    note: "Outside KOANO's coverage for this market. No data was queried.",
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

// Verdict colors (Section 10). VERDICT_COLORS is the TEXT ink (AA on white) for
// the verdict word, table cells and chips; VERDICT_FILLS is the saturated hue
// for bars, bands and dots. Never set a fill hue as a text color (A16).
export const VERDICT_COLORS: Record<Verdict, string> = {
  buy: "var(--signal-positive-ink)",
  sell: "var(--signal-negative-ink)",
  drop: "var(--signal-negative-ink)",
  hold: "var(--mid-blue-ink)",
  wait: "var(--signal-warning-ink)",
};
export const VERDICT_FILLS: Record<Verdict, string> = {
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
