// Shared agent infrastructure — KOANO Phase A.
// - Single exported runtime model constant (Sonnet-class, per CLAUDE.md Section 02)
// - Prompt caching on every agent system prompt
// - Structured JSON output only (never raw prose)
// - Provenance is computed deterministically in code, never by the LLM.

import Anthropic from '@anthropic-ai/sdk';
import type { DataPoint, Provenance } from '../providers/types';

// Sonnet-class runtime model. Single source of truth for every agent call.
// NOTE: CLAUDE.md v4 specifies claude-sonnet-4-20250514, but that model reached
// end-of-life on 2026-06-15. Using the current Sonnet-class model instead.
export const KOANO_RUNTIME_MODEL = 'claude-sonnet-4-6';

export type AgentName =
  | 'market-timing'
  | 'infrastructure'
  | 'demand-sentiment'
  | 'risk-volatility'
  | 'regulatory-policy'
  | 'synthesis';

export type Verdict = 'buy' | 'sell' | 'hold' | 'wait' | 'drop';

export interface ReasoningStep {
  step: number;
  agent: AgentName;
  observation: string;
  sources: string[]; // provider source names cited for this step
  provenance: Provenance; // weakest provenance among cited sources
}

export interface MinoritySignal {
  agent: AgentName;
  signal: string;
  note: string | null;
}

// KoanoVerdict — CLAUDE.md Section 09 schema.
export interface KoanoVerdict {
  verdict: Verdict;
  confidence: number; // 0–100
  signal_window_months: number;
  headline: string;
  reasoning_chain: ReasoningStep[];
  minority_signals: MinoritySignal[];
  top_data_sources: string[];
  irr_estimate?: number; // Clusters 4 & 5 only
  risk_score: number; // 0–100
  generated_at: string;
}

// A specialist agent's output: KoanoVerdict + provenance bookkeeping.
export interface AgentVerdict extends KoanoVerdict {
  agent: AgentName;
  data_points: DataPoint[]; // every fact the agent saw, provenance-tagged
  overall_provenance: Provenance; // WEAKEST provenance among inputs
}

export function weakestProvenance(points: { provenance: Provenance }[]): Provenance {
  return points.some((p) => p.provenance === 'representative') ? 'representative' : 'live';
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

// ---------------------------------------------------------------------------
// Anthropic client + structured agent call
// ---------------------------------------------------------------------------

let _client: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

// What the LLM is asked to return. Provenance fields are added in code.
export interface LlmAgentResponse {
  verdict: Verdict;
  confidence: number;
  signal_window_months: number;
  headline: string;
  reasoning: { observation: string; sources: string[] }[];
  minority_signals: { signal: string; note?: string }[];
  risk_score: number;
}

const RESPONSE_FORMAT_INSTRUCTIONS = `
You MUST respond with a single JSON object and nothing else. No markdown fences, no prose.
Schema:
{
  "verdict": "buy" | "sell" | "hold" | "wait" | "drop",
  "confidence": <integer 0-100>,
  "signal_window_months": <integer 1-36>,
  "headline": "<one sentence, plain language, cites the strongest fact>",
  "reasoning": [
    { "observation": "<one concrete inference from the data>", "sources": ["<exact source name(s) from the data points you relied on>"] }
  ],
  "minority_signals": [
    { "signal": "<a data point that cuts against your verdict>", "note": "<why it was outweighed>" }
  ],
  "risk_score": <integer 0-100, higher = riskier>
}
Rules:
- Every reasoning step MUST cite at least one "source" copied EXACTLY from the provided data points.
- Never invent facts not present in the data points.
- If a data point is marked provenance "representative", treat it as indicative only and say so in the observation.
- 3 to 6 reasoning steps. minority_signals may be empty.`;

function extractJson(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Agent LLM did not return JSON: ${text.slice(0, 200)}`);
  }
  return text.slice(start, end + 1);
}

export async function callAgentLLM(args: {
  agent: AgentName;
  systemPrompt: string;
  addressLabel: string;
  dataPoints: DataPoint[];
}): Promise<LlmAgentResponse> {
  const { agent, systemPrompt, addressLabel, dataPoints } = args;

  const userPayload = JSON.stringify(
    {
      subject_address: addressLabel,
      data_points: dataPoints.map((d) => ({
        label: d.label,
        value: d.value,
        provenance: d.provenance,
        source: d.source,
      })),
    },
    null,
    2
  );

  const msg = await anthropic().messages.create({
    model: KOANO_RUNTIME_MODEL,
    max_tokens: 2000,
    system: [
      {
        type: 'text',
        text: systemPrompt + '\n' + RESPONSE_FORMAT_INSTRUCTIONS,
        cache_control: { type: 'ephemeral' }, // prompt caching on the system prompt
      },
    ],
    messages: [{ role: 'user', content: userPayload }],
  });

  const textBlock = msg.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error(`Agent ${agent}: no text block in LLM response`);
  }

  const raw = JSON.parse(extractJson(textBlock.text)) as Partial<LlmAgentResponse>;

  const validVerdicts: Verdict[] = ['buy', 'sell', 'hold', 'wait', 'drop'];
  if (!raw.verdict || !validVerdicts.includes(raw.verdict)) {
    throw new Error(`Agent ${agent}: invalid verdict "${String(raw.verdict)}"`);
  }
  if (!Array.isArray(raw.reasoning) || raw.reasoning.length === 0) {
    throw new Error(`Agent ${agent}: empty reasoning`);
  }

  return {
    verdict: raw.verdict,
    confidence: clamp(Number(raw.confidence ?? 50), 0, 100),
    signal_window_months: clamp(Number(raw.signal_window_months ?? 12), 1, 36),
    headline: String(raw.headline ?? '').trim() || `${agent} verdict: ${raw.verdict}`,
    reasoning: raw.reasoning.map((r) => ({
      observation: String(r.observation ?? ''),
      sources: Array.isArray(r.sources) ? r.sources.map(String) : [],
    })),
    minority_signals: Array.isArray(raw.minority_signals)
      ? raw.minority_signals.map((m) => ({ signal: String(m.signal ?? ''), note: m.note ? String(m.note) : undefined }))
      : [],
    risk_score: clamp(Number(raw.risk_score ?? 50), 0, 100),
  };
}

// Assemble a full AgentVerdict from the LLM response + the provenance-tagged
// data points the agent actually consumed. Provenance is computed here, in code.
export function assembleAgentVerdict(args: {
  agent: AgentName;
  llm: LlmAgentResponse;
  dataPoints: DataPoint[];
}): AgentVerdict {
  const { agent, llm, dataPoints } = args;

  const provenanceBySource = new Map<string, Provenance>();
  for (const d of dataPoints) {
    const existing = provenanceBySource.get(d.source);
    // a source is representative if ANY of its points are
    provenanceBySource.set(
      d.source,
      existing === 'representative' || d.provenance === 'representative' ? 'representative' : d.provenance
    );
  }

  const reasoning_chain: ReasoningStep[] = llm.reasoning.map((r, i) => {
    const cited = r.sources.filter((s) => provenanceBySource.has(s));
    const stepProvenance: Provenance =
      cited.length === 0
        ? weakestProvenance(dataPoints)
        : cited.some((s) => provenanceBySource.get(s) === 'representative')
          ? 'representative'
          : 'live';
    return {
      step: i + 1,
      agent,
      observation: r.observation,
      sources: r.sources,
      provenance: stepProvenance,
    };
  });

  return {
    agent,
    verdict: llm.verdict,
    confidence: llm.confidence,
    signal_window_months: llm.signal_window_months,
    headline: llm.headline,
    reasoning_chain,
    minority_signals: llm.minority_signals.map((m) => ({ agent, signal: m.signal, note: m.note ?? null })),
    top_data_sources: Array.from(provenanceBySource.keys()),
    risk_score: llm.risk_score,
    generated_at: new Date().toISOString(),
    data_points: dataPoints,
    overall_provenance: weakestProvenance(dataPoints),
  };
}
