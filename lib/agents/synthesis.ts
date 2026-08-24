// KOANO Synthesis agent — Step 5.
// Receives all 5 specialist AgentVerdicts simultaneously and returns ONE unified
// KoanoVerdict. Arbitration logic (CLAUDE.md Section 09):
//   1. Consensus amplification — 4+ agents agreeing raises confidence
//   2. Conflict surfacing — disagreements go to minority_signals, never hidden
//   3. Domain weighting + recency handled in the synthesis prompt
// overall_provenance = the WEAKEST provenance among all agent inputs.
// The final reasoning chain assembles all five agents' chains with attribution,
// then appends the synthesis agent's own arbitration steps.

import { registry } from '../providers/registry';
import type { Provenance, ResolvedAddress } from '../providers/types';
import {
  runWithDegradationTracking,
  summarizeDegradations,
  type DegradationSummary,
} from '../providers/degradation';
import {
  callAgentLLM,
  clamp,
  weakestProvenance,
  type AgentName,
  type AgentVerdict,
  type KoanoVerdict,
  type MinoritySignal,
  type ReasoningStep,
  type Verdict,
} from './shared';
import {
  DIRECTION,
  THRESHOLDS,
  verdictFromScore,
  type AgentContribution,
  type WeightingBreakdown,
  type AgentSummary,
} from './breakdown';
// Re-exported so existing server importers of these from './synthesis' keep working.
export {
  breakdownFromSummaries,
  type AgentContribution,
  type WeightingBreakdown,
  type AgentSummary,
} from './breakdown';
import { runRegulatoryPolicyAgent } from './regulatory-policy';
import { runInfrastructureAgent } from './infrastructure';
import { runDemandSentimentAgent } from './demand-sentiment';
import { runRiskVolatilityAgent } from './risk-volatility';
import { runMarketTimingAgent } from './market-timing';

// The synthesis LLM is a NARRATOR only. The verdict, confidence, risk, and
// window are decided by KOANO's deterministic aggregator (below); the model
// receives that decision and explains it. It cannot change the verdict —
// runSynthesis enforces the code verdict and logs any contradiction.
const NARRATOR_SYSTEM_PROMPT = `You are KOANO's Synthesis narrator. KOANO's deterministic aggregator has ALREADY decided the verdict, confidence, risk score, and signal window from the five specialist agents. You do NOT decide these and MUST NOT change them — you write the arbitration narrative that EXPLAINS the decision.

You are given: each specialist's verdict, confidence, headline, and observations; the confidence-weighted score and thresholds; and the FINAL computed verdict/confidence/risk. Explain, in the arbitration:
- which specialists carried the most weight (higher confidence weighs more) and which cut against the call;
- where the panel agrees and where it conflicts;
- how the confidence-weighted score resolved to this verdict against the thresholds;
- when specialists conflict, weigh those with fully-live evidence more heavily than those marked representative — but do NOT describe data as live, representative, verified, or confirmed in your prose. Provenance is shown by the badges, in code; it is never yours to assert.

Output rules:
- Your "verdict" field MUST equal the given final verdict exactly. Never state a different verdict, in the field or the prose.
- reasoning steps: the arbitration story; "sources" must be exact agent labels (e.g. "regulatory-policy agent").
- headline: one plain sentence a homeowner understands, citing the single strongest fact, consistent with the final verdict.
- Never invent figures. Do not restate confidence/risk numbers other than the given ones.
- PROVENANCE is not yours to claim: never call any fact "live", "live-confirmed", "verified", "confirmed", "real-time", or "authoritative". The badges carry that.
- CERTAINTY must match the given confidence — never write "definitely", "guaranteed", "certain", "proven", or "without doubt".
- RECENCY must be sourced: do not write "recent", "latest", "as of today", or "currently" unless a data point supplies the actual date.`;

// --- deterministic aggregation ------------------------------------------------
// The aggregation constants (DIRECTION/THRESHOLDS/verdictFromScore), the
// WeightingBreakdown types, and the pure breakdownFromSummaries reconstruction
// now live in the client-safe ./breakdown module (imported at the top, and
// re-exported for existing server importers). One source of truth for the math.

interface Aggregate {
  breakdown: WeightingBreakdown;
  verdict: Verdict;
  confidence: number;
  risk_score: number;
  signal_window_months: number;
  overall_provenance: Provenance;
}

// Pure function of the agent outputs — identical inputs give identical results.
// Exported so the determinism harness can prove it without any LLM call.
export function aggregate(agents: AgentVerdict[]): Aggregate {
  const contribs: AgentContribution[] = agents.map((a) => ({
    agent: a.agent,
    verdict: a.verdict,
    confidence: a.confidence,
    direction: DIRECTION[a.verdict],
    weight: a.confidence,
    contribution: a.confidence * DIRECTION[a.verdict],
  }));
  const totalWeight = contribs.reduce((s, c) => s + c.weight, 0) || 1;
  const score = contribs.reduce((s, c) => s + c.contribution, 0) / totalWeight;
  const verdict = verdictFromScore(score);

  const overall_provenance = weakestProvenance(agents.map((a) => ({ provenance: a.overall_provenance })));
  const matchWeight = contribs.filter((c) => c.verdict === verdict).reduce((s, c) => s + c.weight, 0);
  const agreementFrac = matchWeight / totalWeight;
  const weightedAvgConf = contribs.reduce((s, c) => s + c.confidence * c.weight, 0) / totalWeight;
  const cap = overall_provenance === 'representative' ? 74 : 95;
  const confidence = Math.min(cap, clamp(20 + 55 * agreementFrac + 0.2 * weightedAvgConf, 40, 95));

  // Risk anchored on the risk-volatility specialist, tempered by the panel mean.
  const rv = agents.find((a) => a.agent === 'risk-volatility');
  const avgRisk = agents.reduce((s, a) => s + a.risk_score, 0) / agents.length;
  const risk_score = clamp(rv ? 0.5 * rv.risk_score + 0.5 * avgRisk : avgRisk, 0, 100);

  // Signal window: the panel median (deterministic).
  const windows = agents.map((a) => a.signal_window_months).sort((x, y) => x - y);
  const signal_window_months = windows[Math.floor(windows.length / 2)];

  return {
    breakdown: {
      method: 'confidence-weighted v1',
      agents: contribs,
      total_weight: totalWeight,
      aggregate_score: Math.round(score * 100) / 100,
      thresholds: THRESHOLDS,
      chosen_verdict: verdict,
    },
    verdict,
    confidence,
    risk_score,
    signal_window_months,
    overall_provenance,
  };
}

export interface SynthesisResult extends KoanoVerdict {
  overall_provenance: Provenance; // weakest provenance across ALL agent inputs
  weighting_breakdown: WeightingBreakdown; // the scored math behind the verdict — shown to the user
  agent_summaries: AgentSummary[];
}

export async function runSynthesis(
  addr: ResolvedAddress,
  agents: AgentVerdict[]
): Promise<SynthesisResult> {
  // --- 1. DETERMINISTIC decision: verdict, confidence, risk, window ---
  const agg = aggregate(agents);

  // --- 2. NARRATOR: the model explains the decision; it cannot change it ---
  const dataPoints = agents.flatMap((a) => {
    const source = `${a.agent} agent`;
    const p = a.overall_provenance;
    return [
      { label: `${a.agent}: verdict`, value: a.verdict, provenance: p, source },
      { label: `${a.agent}: confidence`, value: a.confidence, provenance: p, source },
      { label: `${a.agent}: headline`, value: a.headline, provenance: p, source },
      {
        label: `${a.agent}: key_observations`,
        value: a.reasoning_chain.map((r) => r.observation).join(' | '),
        provenance: p,
        source,
      },
      {
        label: `${a.agent}: evidence_provenance`,
        value: `${a.data_points.filter((d) => d.provenance === 'live').length} live / ${a.data_points.filter((d) => d.provenance === 'representative').length} representative data points`,
        provenance: p,
        source,
      },
    ];
  });
  dataPoints.push(
    { label: 'COMPUTED_verdict (fixed)', value: agg.verdict, provenance: agg.overall_provenance, source: 'KOANO aggregator' },
    { label: 'COMPUTED_confidence (fixed)', value: agg.confidence, provenance: agg.overall_provenance, source: 'KOANO aggregator' },
    { label: 'COMPUTED_risk_score (fixed)', value: agg.risk_score, provenance: agg.overall_provenance, source: 'KOANO aggregator' },
    {
      label: 'weighting_breakdown',
      value: agg.breakdown.agents.map((c) => `${c.agent} ${c.verdict}@${c.confidence} (dir ${c.direction}, contrib ${c.contribution})`).join('; ') +
        ` | weighted score ${agg.breakdown.aggregate_score} vs thresholds buy≥${THRESHOLDS.buy}, hold≥${THRESHOLDS.hold}, wait≥${THRESHOLDS.wait}`,
      provenance: agg.overall_provenance,
      source: 'KOANO aggregator',
    }
  );

  const llm = await callAgentLLM({
    agent: 'synthesis',
    systemPrompt: NARRATOR_SYSTEM_PROMPT,
    addressLabel: addr.normalized || addr.input,
    dataPoints,
    temperature: 0.4, // narrator only — decides nothing, so warmth here is safe
  });

  // --- 3. CONTRADICTION GUARD: the code verdict is authoritative; log if the
  //         narrator ever states a different one (silent contradiction between a
  //         verdict and the prose explaining it would be worse than either). ---
  if (llm.verdict !== agg.verdict) {
    console.warn(
      `[synthesis] contradiction guard fired: narrator stated "${llm.verdict}" but the computed verdict is "${agg.verdict}" (score ${agg.breakdown.aggregate_score}). Code verdict wins.`
    );
  }

  // --- 4. reasoning chain: 5 specialists → the deterministic "verdict math"
  //         step (visible + persisted) → the narrator's arbitration prose ---
  const provenanceByAgentSource = new Map<string, Provenance>(
    agents.map((a) => [`${a.agent} agent`, a.overall_provenance])
  );
  const reasoning_chain: ReasoningStep[] = [];
  for (const a of agents) {
    for (const step of a.reasoning_chain) {
      reasoning_chain.push({ ...step, step: reasoning_chain.length + 1 });
    }
  }
  reasoning_chain.push({
    step: reasoning_chain.length + 1,
    agent: 'synthesis',
    observation:
      `Verdict math (confidence-weighted v1): ` +
      agg.breakdown.agents.map((c) => `${c.agent} ${c.verdict}@${c.confidence}→${c.contribution >= 0 ? '+' : ''}${c.contribution}`).join(', ') +
      `. Weighted score ${agg.breakdown.aggregate_score} (buy≥${THRESHOLDS.buy}, hold≥${THRESHOLDS.hold}, wait≥${THRESHOLDS.wait}) → ${agg.verdict.toUpperCase()} at confidence ${agg.confidence}.`,
    sources: agents.map((a) => `${a.agent} agent`),
    provenance: agg.overall_provenance,
  });
  for (const r of llm.reasoning) {
    const cited = r.sources.filter((s) => provenanceByAgentSource.has(s));
    reasoning_chain.push({
      step: reasoning_chain.length + 1,
      agent: 'synthesis',
      observation: r.observation,
      sources: r.sources,
      provenance:
        cited.length === 0
          ? agg.overall_provenance
          : cited.some((s) => provenanceByAgentSource.get(s) === 'representative')
            ? 'representative'
            : 'live',
    });
  }

  // --- conflict surfacing: narrator notes + a deterministic entry per dissenter ---
  const minority_signals: MinoritySignal[] = llm.minority_signals.map((m) => ({
    agent: 'synthesis',
    signal: m.signal,
    note: m.note ?? null,
  }));
  for (const a of agents) {
    if (a.verdict !== agg.verdict) {
      minority_signals.push({
        agent: a.agent,
        signal: `${a.agent} dissented with "${a.verdict}" (confidence ${a.confidence}): ${a.headline}`,
        note: null,
      });
    }
  }

  const top_data_sources = Array.from(new Set(agents.flatMap((a) => a.top_data_sources)));

  return {
    verdict: agg.verdict,
    confidence: agg.confidence,
    signal_window_months: agg.signal_window_months,
    headline: llm.headline,
    reasoning_chain,
    minority_signals,
    top_data_sources,
    risk_score: agg.risk_score,
    generated_at: new Date().toISOString(),
    overall_provenance: agg.overall_provenance,
    weighting_breakdown: agg.breakdown,
    agent_summaries: agents.map((a) => ({
      agent: a.agent,
      verdict: a.verdict,
      confidence: a.confidence,
      risk_score: a.risk_score,
      overall_provenance: a.overall_provenance,
      headline: a.headline,
    })),
  };
}

// Progress events emitted as the pipeline advances. Every event reflects a
// REAL completion — never simulated progress (Principle 2 applies to UI state
// too). Consumed by the streaming API route for agent-by-agent loading UI.
export type PipelineProgressEvent =
  | { type: 'geocoded'; normalized: string; bbl: string | null }
  | {
      type: 'agent_complete';
      agent: AgentName;
      verdict: Verdict;
      confidence: number;
      overall_provenance: Provenance;
    }
  | { type: 'synthesis_start' };

export interface PipelineResult {
  resolved_address: ResolvedAddress;
  agents: AgentVerdict[];
  verdict: SynthesisResult;
  // Throttle/timeout degradation for THIS run — a fixable infrastructure
  // condition, distinct from a per-figure data-unavailable. Empty when clean.
  degradation: DegradationSummary;
}

// Full KOANO pipeline: geocode → 5 specialist agents in parallel → synthesis.
export async function runKoanoPipeline(
  address: string,
  onEvent?: (e: PipelineProgressEvent) => void
): Promise<PipelineResult> {
  const geo = await registry.geocode.resolve(address);
  if (!geo.ok || !geo.data) {
    throw new Error(`Geocoding failed for "${address}": ${geo.error ?? 'no data'}`);
  }
  return runKoanoPipelineForAddress(geo.data, onEvent);
}

// The pipeline from an ALREADY-RESOLVED address — used when the caller has
// re-derived the address server-side from a chosen disambiguation candidate, so
// geocoding is never re-run (and can never re-ambiguate).
export async function runKoanoPipelineForAddress(
  addr: ResolvedAddress,
  onEvent?: (e: PipelineProgressEvent) => void,
): Promise<PipelineResult> {
  onEvent?.({ type: 'geocoded', normalized: addr.normalized, bbl: addr.bbl });

  // Report each specialist the moment its real verdict lands.
  const track = (p: Promise<AgentVerdict>) =>
    p.then((v) => {
      onEvent?.({
        type: 'agent_complete',
        agent: v.agent,
        verdict: v.verdict,
        confidence: v.confidence,
        overall_provenance: v.overall_provenance,
      });
      return v;
    });

  // Track throttle/timeout degradation across all five parallel agents + their
  // provider fetches (AsyncLocalStorage propagates through Promise.all).
  const { result, degradations } = await runWithDegradationTracking(async () => {
    const agents = await Promise.all([
      track(runMarketTimingAgent(addr)),
      track(runInfrastructureAgent(addr)),
      track(runDemandSentimentAgent(addr)),
      track(runRiskVolatilityAgent(addr)),
      track(runRegulatoryPolicyAgent(addr)),
    ]);
    onEvent?.({ type: 'synthesis_start' });
    const verdict = await runSynthesis(addr, agents);
    return { agents, verdict };
  });

  return {
    resolved_address: addr,
    agents: result.agents,
    verdict: result.verdict,
    degradation: summarizeDegradations(degradations),
  };
}
