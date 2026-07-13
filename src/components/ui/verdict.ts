// Client-safe verdict types + display metadata shared by the verdict UI.
// Type-only re-exports from /lib are erased at compile time — no server code
// (Anthropic SDK, Supabase) ever reaches the client bundle through this file.

export type { DataPoint, Provenance } from "../../../lib/providers/types";
export type {
  AgentName,
  KoanoVerdict,
  MinoritySignal,
  ReasoningStep,
  Verdict,
} from "../../../lib/agents/shared";
export type { SynthesisResult } from "../../../lib/agents/synthesis";
export type { PipelineProgressEvent } from "../../../lib/agents/synthesis";

import type { AgentName, Verdict } from "../../../lib/agents/shared";

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
