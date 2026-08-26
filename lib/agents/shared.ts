// Shared agent infrastructure — KOANO Phase A.
// - Single exported runtime model constant (Sonnet-class, per CLAUDE.md Section 02)
// - Prompt caching on every agent system prompt
// - Structured JSON output only (never raw prose)
// - Provenance is computed deterministically in code, never by the LLM.

import Anthropic from '@anthropic-ai/sdk';
import type { DataPoint, Provenance } from '../providers/types';
import { buildAllowedTokens, groundObservation, WITHHELD_OBSERVATION } from './grounding';
import { deterministicConfidence, blendConfidence } from './confidence';
import { viaCassette } from '../testing/cassette';

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
  // True when the grounding gate removed this observation because a claim in it
  // could not be traced to a cited source. The step stays in the chain (visibly
  // incomplete) rather than being silently dropped.
  withheld?: boolean;
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
  risk_score: number; // 0–100
  generated_at: string;
}

// A specialist agent's output: KoanoVerdict + provenance bookkeeping.
export interface AgentVerdict extends KoanoVerdict {
  agent: AgentName;
  data_points: DataPoint[]; // every fact the agent saw, provenance-tagged
  overall_provenance: Provenance; // WEAKEST provenance among inputs
}

// The provenance rollup lives in the pure, client-safe ./providers/provenance
// module (one source of truth for agents, documents, and UI). Imported for local
// use AND re-exported so existing `import { weakestProvenance } from './shared'`
// call sites are untouched.
import { weakestProvenance } from '../providers/provenance';
export { weakestProvenance };

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

// ---------------------------------------------------------------------------
// Anthropic client + structured agent call
// ---------------------------------------------------------------------------

let _client: Anthropic | null = null;
export function getAnthropicClient(): Anthropic {
  return anthropic();
}
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
  reasoning: { observation: string; sources: string[]; withheld?: boolean }[];
  minority_signals: { signal: string; note?: string }[];
  risk_score: number;
}

const RESPONSE_FORMAT_INSTRUCTIONS = `
You MUST respond with a single JSON object and nothing else. No markdown fences, no prose.
Schema:
{
  "verdict": "buy" | "sell" | "hold" | "wait" | "drop",
  "conviction": "low" | "medium" | "high",
  "risk_band": "low" | "moderate" | "high",
  "window_band": "short" | "medium" | "long",
  "headline": "<one sentence, plain language, cites the strongest fact>",
  "reasoning": [
    { "observation": "<one concrete inference from the data>", "sources": ["<exact source name(s) from the data points you relied on>"] }
  ],
  "minority_signals": [
    { "signal": "<a data point that cuts against your verdict>", "note": "<why it was outweighed>" }
  ]
}
Judge BANDS, not numbers. You can reliably tell low from high conviction; you cannot meaningfully tell 62 from 65, so KOANO never asks you to. Report a band and KOANO's code turns it into a figure.
- verdict: the action your evidence most decisively supports. If the evidence is genuinely mixed or thin, prefer the steadier verdict (hold over buy, wait over sell) — do NOT manufacture a directional call from weak signal.
- conviction: how decisively the evidence supports your verdict. low = mixed or thin evidence; medium = a clear lean; high = strong, converging evidence.
- risk_band: the downside/volatility level in the evidence. low / moderate / high.
- window_band: the horizon over which acting on this makes sense. short (~quarter) / medium (~year) / long (~two years).
Rules:
- Every reasoning step MUST cite at least one "source" copied EXACTLY from the provided data points.
- Never invent facts not present in the data points.
- GROUNDING (critical): a citation is only valid if the CLAIM comes from that source's data — not just the source name. When a data point gives you a code, abbreviation, ID, or flag (a special-district letter, a zoning code, a building-class code, a boolean), you may state that value and cite its source, but you MUST NOT expand it into a name, place, program, statute, year, designation, or obligation unless another data point literally supplies that detail. Example of the forbidden move: a datum "special_district = G" does NOT license "the Gowanus Special District, adopted 2021, with Mandatory Inclusionary Housing and Superfund remediation obligations" — that is general knowledge, not sourced data. State "special district G (per the zoning source)" and stop.
- You MAY state documented STANDARD DEFINITIONS of codes (e.g. HPD class C = immediately hazardous; FEMA zone X = outside the Special Flood Hazard Area; a manufacturing/residential zoning family). These are fixed definitions, not property-specific claims. Do not go beyond them.
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

// --- coarse bands → deterministic numbers ------------------------------------
// The model judges a band (which temp-0 reproduces reliably); code turns the
// band into the figure. This removes the invented precision of a fine integer
// confidence/risk that wobbled a few points between otherwise-identical runs.
const CONVICTION_TO_CONFIDENCE: Record<string, number> = { low: 58, medium: 72, high: 86 };
const RISK_BAND_TO_SCORE: Record<string, number> = { low: 25, moderate: 50, high: 80 };
const WINDOW_BAND_TO_MONTHS: Record<string, number> = { short: 3, medium: 12, long: 24 };

// Deterministic, conservative tie-break for a boundary verdict. An ACTION
// verdict (buy/sell/drop) requires at least MEDIUM conviction; a low-conviction
// action collapses to the steadier verdict (buy→hold, sell/drop→wait). This
// closes the residual temp-0 boundary flip in code rather than trusting the
// prompt alone, and resolves conservatively — the same direction as the
// synthesis margin.
function tieBreakVerdict(verdict: Verdict, conviction: string): Verdict {
  if (conviction === 'low') {
    if (verdict === 'buy') return 'hold';
    if (verdict === 'sell' || verdict === 'drop') return 'wait';
  }
  return verdict;
}

function oneOf(value: unknown, allowed: readonly string[], fallback: string): string {
  const s = String(value ?? '').toLowerCase().trim();
  return allowed.includes(s) ? s : fallback;
}

export async function callAgentLLM(args: {
  agent: AgentName;
  systemPrompt: string;
  addressLabel: string;
  dataPoints: DataPoint[];
  // Temperature is EXPLICIT, never the API default (1.0). The five specialist
  // agents run at 0 so their verdicts are reproducible on identical data; the
  // synthesis NARRATIVE call passes a higher value since it decides nothing.
  temperature?: number;
}): Promise<LlmAgentResponse> {
  const { agent, systemPrompt, addressLabel, dataPoints, temperature = 0 } = args;

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

  // One model call + parse. Reused for the grounding retry.
  // The cassette (Phase 5 fixture) freezes only the raw completion TEXT here; on
  // replay everything below — extractJson, JSON.parse, band mapping, grounding,
  // blending, aggregation — runs live on the frozen text, so a decision-code
  // regression is caught while model drift is not. In production the cassette is
  // 'off' and this is a plain pass-through.
  async function runModel(messages: Anthropic.MessageParam[]): Promise<{ text: string; raw: Record<string, unknown> }> {
    const text = await viaCassette<string>('llm', { agent, temperature, systemPrompt, messages }, async () => {
      const msg = await anthropic().messages.create({
        model: KOANO_RUNTIME_MODEL,
        max_tokens: 2000,
        temperature,
        system: [
          {
            type: 'text',
            text: systemPrompt + '\n' + RESPONSE_FORMAT_INSTRUCTIONS,
            cache_control: { type: 'ephemeral' }, // prompt caching on the system prompt
          },
        ],
        messages,
      });
      const tb = msg.content.find((b) => b.type === 'text');
      if (!tb || tb.type !== 'text') throw new Error(`Agent ${agent}: no text block in LLM response`);
      return tb.text;
    });
    return { text, raw: JSON.parse(extractJson(text)) as Record<string, unknown> };
  }

  const first = await runModel([{ role: 'user', content: userPayload }]);
  const raw = first.raw;

  const validVerdicts: Verdict[] = ['buy', 'sell', 'hold', 'wait', 'drop'];
  const rawVerdict = raw.verdict as Verdict;
  if (!rawVerdict || !validVerdicts.includes(rawVerdict)) {
    throw new Error(`Agent ${agent}: invalid verdict "${String(raw.verdict)}"`);
  }
  if (!Array.isArray(raw.reasoning) || raw.reasoning.length === 0) {
    throw new Error(`Agent ${agent}: empty reasoning`);
  }

  const toItems = (arr: unknown): { observation: string; sources: string[] }[] =>
    (Array.isArray(arr) ? arr : []).map((r) => ({
      observation: String((r as { observation?: unknown }).observation ?? ''),
      sources: Array.isArray((r as { sources?: unknown }).sources)
        ? ((r as { sources: unknown[] }).sources).map(String)
        : [],
    }));

  // Coarse bands → deterministic figures; conservative code tie-break on verdict.
  // Decision fields come from the FIRST response; grounding only cleans the prose.
  const conviction = oneOf(raw.conviction, ['low', 'medium', 'high'], 'medium');
  const riskBand = oneOf(raw.risk_band, ['low', 'moderate', 'high'], 'moderate');
  const windowBand = oneOf(raw.window_band, ['short', 'medium', 'long'], 'medium');
  const verdict = tieBreakVerdict(rawVerdict, conviction);
  const safeHeadline = `${agent} verdict: ${verdict}`;

  // --- GROUNDING GATE (Option A) ---------------------------------------------
  // Every specific claim in an observation OR the headline must trace to a value
  // the agent received (or a standard definition). If not: re-prompt ONCE with
  // the exact untraceable terms; anything still ungrounded is WITHHELD (visibly,
  // never dropped) so the reasoning chain is honestly incomplete rather than
  // wrong. The headline is gated too — it is the most-rendered surface and it
  // seeds the synthesis narrator's allowed vocabulary.
  const allowed = buildAllowedTokens(dataPoints, addressLabel);
  const firstItems = toItems(raw.reasoning);
  const firstHeadline = String(raw.headline ?? '').trim();
  const firstGround = firstItems.map((it) => groundObservation(it.observation, allowed));
  const firstHeadlineOk = groundObservation(firstHeadline, allowed).grounded;

  let reasoning: LlmAgentResponse['reasoning'];
  let headline: string;
  if (firstGround.every((g) => g.grounded) && firstHeadlineOk) {
    reasoning = firstItems;
    headline = firstHeadline || safeHeadline;
  } else {
    const terms = Array.from(
      new Set([...firstGround.flatMap((g) => g.ungrounded), ...groundObservation(firstHeadline, allowed).ungrounded]),
    );
    console.warn(`[grounding] ${agent}: untraceable ${JSON.stringify(terms)} — re-prompting once`);
    const correction =
      `Some claims in your response could not be traced to the provided data points: ${terms
        .map((t) => `"${t}"`)
        .join(', ')}. These read as general knowledge, not sourced facts. Rewrite your reasoning AND headline using ONLY what the data points state — for any coded field (a district letter, zoning code, class, flag), state the code and its value as given and do NOT expand it into names, places, years, programs, or obligations. Return the same JSON object.`;
    const second = await runModel([
      { role: 'user', content: userPayload },
      { role: 'assistant', content: first.text },
      { role: 'user', content: correction },
    ]);
    const secondItems = toItems(second.raw.reasoning);
    const base = secondItems.length > 0 ? secondItems : firstItems;
    reasoning = base.map((it) => {
      if (groundObservation(it.observation, allowed).grounded) return it;
      console.warn(`[grounding] ${agent}: WITHHELD an observation that stayed untraceable after retry`);
      return { observation: WITHHELD_OBSERVATION, sources: [], withheld: true };
    });
    const retryHeadline = String(second.raw.headline ?? '').trim();
    headline = retryHeadline && groundObservation(retryHeadline, allowed).grounded ? retryHeadline : safeHeadline;
    if (headline === safeHeadline) console.warn(`[grounding] ${agent}: headline fell back (untraceable after retry)`);
  }

  return {
    verdict,
    confidence: CONVICTION_TO_CONFIDENCE[conviction],
    signal_window_months: WINDOW_BAND_TO_MONTHS[windowBand],
    headline,
    reasoning,
    minority_signals: Array.isArray(raw.minority_signals)
      ? (raw.minority_signals as Array<{ signal?: unknown; note?: unknown }>).map((m) => ({
          signal: String(m.signal ?? ''),
          note: m.note ? String(m.note) : undefined,
        }))
      : [],
    risk_score: RISK_BAND_TO_SCORE[riskBand],
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
    // a source's provenance is the WEAKEST of its points (across all five states)
    provenanceBySource.set(
      d.source,
      existing ? weakestProvenance([{ provenance: existing }, { provenance: d.provenance }]) : d.provenance,
    );
  }

  const reasoning_chain: ReasoningStep[] = llm.reasoning.map((r, i) => {
    const cited = r.sources.filter((s) => provenanceBySource.has(s));
    const stepProvenance: Provenance =
      cited.length === 0
        ? weakestProvenance(dataPoints)
        : weakestProvenance(cited.map((s) => ({ provenance: provenanceBySource.get(s)! })));
    return {
      step: i + 1,
      agent,
      observation: r.observation,
      sources: r.sources,
      provenance: stepProvenance,
      ...(r.withheld ? { withheld: true } : {}),
    };
  });

  // Confidence is DRIVEN by the evidence (strength · richness · agreement), not the
  // model's conviction band (which pinned at medium=72 everywhere and flattened the
  // synthesis weighting). The band only adjusts. See lib/agents/confidence.ts.
  const confidence = blendConfidence(
    deterministicConfidence(dataPoints, llm.minority_signals.length),
    llm.confidence,
  );

  return {
    agent,
    verdict: llm.verdict,
    confidence,
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
