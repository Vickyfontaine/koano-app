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
import { runRegulatoryPolicyAgent } from './regulatory-policy';
import { runInfrastructureAgent } from './infrastructure';
import { runDemandSentimentAgent } from './demand-sentiment';
import { runRiskVolatilityAgent } from './risk-volatility';
import { runMarketTimingAgent } from './market-timing';

const SYSTEM_PROMPT = `You are KOANO's Synthesis agent. Five specialist agents (market-timing, infrastructure, demand-sentiment, risk-volatility, regulatory-policy) have each delivered a verdict on the same property. You arbitrate them into ONE unified verdict.

Arbitration logic:
1. Consensus amplification — when 4+ specialists agree, confidence rises; unanimous agreement should push confidence high (85+). Split panels cap confidence in the 50s-60s.
2. Conflict surfacing — every specialist whose verdict cuts against your final call MUST appear in minority_signals with their strongest counter-argument. Never hide disagreement.
3. Domain weighting — weight the agents whose domain dominates the situation. A site with an active foundation permit and 97% unused FAR is a DEVELOPMENT story: regulatory-policy and infrastructure carry more weight. A finished condo in a stable area is a TIMING story: market-timing and demand carry more weight.
4. Provenance discipline — specialist inputs marked "representative" are indicative stand-ins, not live market data. Lean harder on the specialists whose evidence is fully live, and say so.

Output rules:
- Your "sources" in each reasoning step must be the exact agent labels provided (e.g. "regulatory-policy agent").
- Your reasoning steps are the ARBITRATION: which agents you weighted up/down and why, where they agree, where they conflict, and how you resolved it.
- headline: one plain-language sentence a homeowner could understand, citing the single strongest fact.
- risk_score: synthesize across the panel, anchored on the risk-volatility agent but adjusted for what the others found.
- signal_window_months: the window in which acting on this verdict makes sense.`;

export interface SynthesisResult extends KoanoVerdict {
  overall_provenance: Provenance; // weakest provenance across ALL agent inputs
  agent_summaries: {
    agent: string;
    verdict: string;
    confidence: number;
    risk_score: number;
    overall_provenance: Provenance;
    headline: string;
  }[];
}

export async function runSynthesis(
  addr: ResolvedAddress,
  agents: AgentVerdict[]
): Promise<SynthesisResult> {
  // --- build the synthesis input: one provenance-tagged block per specialist ---
  const dataPoints = agents.flatMap((a) => {
    const source = `${a.agent} agent`;
    const p = a.overall_provenance;
    return [
      { label: `${a.agent}: verdict`, value: a.verdict, provenance: p, source },
      { label: `${a.agent}: confidence`, value: a.confidence, provenance: p, source },
      { label: `${a.agent}: risk_score`, value: a.risk_score, provenance: p, source },
      { label: `${a.agent}: signal_window_months`, value: a.signal_window_months, provenance: p, source },
      { label: `${a.agent}: headline`, value: a.headline, provenance: p, source },
      {
        label: `${a.agent}: key_observations`,
        value: a.reasoning_chain.map((r) => r.observation).join(' | '),
        provenance: p,
        source,
      },
      {
        label: `${a.agent}: minority_signals`,
        value: a.minority_signals.map((m) => m.signal).join(' | ') || 'none',
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

  // consensus stats, computed in code, handed to the arbiter
  const verdictCounts = new Map<string, number>();
  for (const a of agents) verdictCounts.set(a.verdict, (verdictCounts.get(a.verdict) ?? 0) + 1);
  const consensusEntry = Array.from(verdictCounts.entries()).sort((x, y) => y[1] - x[1])[0];
  dataPoints.push({
    label: 'panel_consensus',
    value: `${consensusEntry[1]} of ${agents.length} specialists say "${consensusEntry[0]}" (full split: ${Array.from(verdictCounts.entries()).map(([v, n]) => `${v}=${n}`).join(', ')})`,
    provenance: weakestProvenance(agents.map((a) => ({ provenance: a.overall_provenance }))),
    source: 'KOANO consensus math',
  });

  const llm = await callAgentLLM({
    agent: 'synthesis',
    systemPrompt: SYSTEM_PROMPT,
    addressLabel: addr.normalized || addr.input,
    dataPoints,
  });

  // --- consensus amplification guardrail (deterministic, in code) ---
  const agreeing = agents.filter((a) => a.verdict === llm.verdict).length;
  const avgAgentConfidence = agents.reduce((s, a) => s + a.confidence, 0) / agents.length;
  let confidence = llm.confidence;
  if (agreeing >= 4) confidence = clamp(Math.max(confidence, avgAgentConfidence + 12), 0, 95);
  else if (agreeing <= 1) confidence = clamp(Math.min(confidence, 65), 0, 100);

  // --- assemble the full reasoning chain: all five specialists, then synthesis ---
  const provenanceByAgentSource = new Map<string, Provenance>(
    agents.map((a) => [`${a.agent} agent`, a.overall_provenance])
  );
  const reasoning_chain: ReasoningStep[] = [];
  for (const a of agents) {
    for (const step of a.reasoning_chain) {
      reasoning_chain.push({ ...step, step: reasoning_chain.length + 1 });
    }
  }
  for (const r of llm.reasoning) {
    const cited = r.sources.filter((s) => provenanceByAgentSource.has(s));
    reasoning_chain.push({
      step: reasoning_chain.length + 1,
      agent: 'synthesis',
      observation: r.observation,
      sources: r.sources,
      provenance:
        cited.length === 0
          ? weakestProvenance(agents.map((a) => ({ provenance: a.overall_provenance })))
          : cited.some((s) => provenanceByAgentSource.get(s) === 'representative')
            ? 'representative'
            : 'live',
    });
  }

  // --- conflict surfacing: LLM signals + a deterministic entry per dissenting agent ---
  const minority_signals: MinoritySignal[] = llm.minority_signals.map((m) => ({
    agent: 'synthesis',
    signal: m.signal,
    note: m.note ?? null,
  }));
  for (const a of agents) {
    if (a.verdict !== llm.verdict) {
      minority_signals.push({
        agent: a.agent,
        signal: `${a.agent} dissented with "${a.verdict}" (confidence ${a.confidence}): ${a.headline}`,
        note: null,
      });
    }
  }

  const top_data_sources = Array.from(new Set(agents.flatMap((a) => a.top_data_sources)));

  return {
    verdict: llm.verdict,
    confidence,
    signal_window_months: llm.signal_window_months,
    headline: llm.headline,
    reasoning_chain,
    minority_signals,
    top_data_sources,
    risk_score: llm.risk_score,
    generated_at: new Date().toISOString(),
    overall_provenance: weakestProvenance(agents.map((a) => ({ provenance: a.overall_provenance }))),
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

// Full KOANO pipeline: geocode → 5 specialist agents in parallel → synthesis.
export async function runKoanoPipeline(
  address: string,
  onEvent?: (e: PipelineProgressEvent) => void
): Promise<{
  resolved_address: ResolvedAddress;
  agents: AgentVerdict[];
  verdict: SynthesisResult;
}> {
  const geo = await registry.geocode.resolve(address);
  if (!geo.ok || !geo.data) {
    throw new Error(`Geocoding failed for "${address}": ${geo.error ?? 'no data'}`);
  }
  const addr = geo.data;
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

  const agents = await Promise.all([
    track(runMarketTimingAgent(addr)),
    track(runInfrastructureAgent(addr)),
    track(runDemandSentimentAgent(addr)),
    track(runRiskVolatilityAgent(addr)),
    track(runRegulatoryPolicyAgent(addr)),
  ]);

  onEvent?.({ type: 'synthesis_start' });
  const verdict = await runSynthesis(addr, agents);
  return { resolved_address: addr, agents, verdict };
}
