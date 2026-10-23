// Trace graph (UI sprint WS5): the dependency thread behind any figure, built
// only from the `complete` payload (the breakdown, the agent summaries, the
// data points). Nothing here is estimated; a node that is not in the payload
// is not on the thread.

import type { Provenance, SynthesisResult } from "../verdict";
import { AGENT_LABELS } from "../verdict";
import { humanizeLabel } from "../humanize";

export type TraceNodeId = "verdict" | "score" | `agent:${string}` | `point:${string}`;

export interface TraceSegment {
  id: TraceNodeId;
  /** What this node is. */
  label: string;
  /** The operation that links it to the node above (e.g. "× conf 82 ÷ Σ 391"). */
  op?: string;
  provenance?: Provenance;
  /** Partner name, unlock source or feed, when the provenance calls for one. */
  note?: string;
}

const fmt = (n: number, d = 2) => `${n >= 0 ? "+" : ""}${n.toFixed(d)}`;

export function pointId(agent: string, label: string): TraceNodeId {
  return `point:${agent}:${label}`;
}

/** The thread for a node: from the figure down to its sources, top first. */
export function buildThread(result: SynthesisResult, node: TraceNodeId): TraceSegment[] {
  const wb = result.weighting_breakdown;
  const points = result.data_points ?? [];
  const head: TraceSegment = { id: "verdict", label: `Verdict ${result.verdict.toUpperCase()}`, provenance: result.overall_provenance };
  if (!wb) return [head, { id: "score", label: "The verdict math was not stored for this run", op: "no breakdown" }];

  const final = wb.final_score ?? wb.aggregate_score;
  const score: TraceSegment = {
    id: "score",
    label: `Final score ${fmt(final)}`,
    op:
      wb.structural_nudge && wb.structural_nudge !== 0
        ? `agent score ${fmt(wb.aggregate_score)} + nudge ${fmt(wb.structural_nudge)} from: ${(wb.structural_drivers ?? []).join("; ")}`
        : `agent score ${fmt(wb.aggregate_score)} against thresholds buy ≥ ${wb.thresholds.buy}, hold ≥ ${wb.thresholds.hold}, wait ≥ ${wb.thresholds.wait}`,
  };
  const agentSeg = (agent: string): TraceSegment | null => {
    const a = wb.agents.find((x) => x.agent === agent);
    if (!a) return null;
    const share = wb.total_weight ? a.contribution / wb.total_weight : 0;
    const prov = result.agent_summaries.find((s) => s.agent === agent)?.overall_provenance;
    return {
      id: `agent:${agent}`,
      label: `${AGENT_LABELS[agent as keyof typeof AGENT_LABELS] ?? agent}: ${a.verdict} at confidence ${a.confidence}`,
      op: a.direction === 0 ? "neutral vote, no weight" : `direction ${a.direction} × conf ${a.confidence} ÷ Σ ${wb.total_weight} = ${fmt(share)}`,
      provenance: prov,
    };
  };
  // The figures an agent read: its own data points, notes excluded (a
  // coverage or scope note is context, not a figure), sources it cited first.
  const cited: string[] = Array.from(
    new Set((result.reasoning_chain ?? []).flatMap((r) => (r as { sources?: string[] }).sources ?? [])),
  );
  const citedBy = (source: string) => cited.some((c) => c && source.includes(c));
  const pointSegs = (agent: string, max: number): TraceSegment[] =>
    points
      .filter((p) => p.agent === agent && !/note|coverage|jurisdiction/i.test(p.label))
      .sort((a, b) => Number(citedBy(b.source)) - Number(citedBy(a.source)))
      .slice(0, max)
      .map((p) => ({
        id: pointId(agent, p.label),
        label: `${humanizeLabel(p.label)} = ${String(p.value ?? "n/a")}`,
        op: `read from ${p.source}`,
        provenance: p.provenance,
      }));

  if (node === "verdict" || node === "score") {
    const movers = wb.agents.filter((a) => a.direction !== 0);
    const out: TraceSegment[] = [head, score];
    for (const m of movers) {
      const s = agentSeg(m.agent);
      if (s) out.push(s, ...pointSegs(m.agent, 3));
    }
    if (movers.length === 0) out.push({ id: "agent:none", label: "No agent returned a directional vote", op: "every vote was hold" });
    return out;
  }
  if (node.startsWith("agent:")) {
    const agent = node.slice(6);
    const s = agentSeg(agent);
    return s ? [head, score, s, ...pointSegs(agent, 8)] : [head, score];
  }
  if (node.startsWith("point:")) {
    const rest = node.slice(6);
    const agent = rest.slice(0, rest.indexOf(":"));
    const label = rest.slice(rest.indexOf(":") + 1);
    const p = points.find((x) => x.agent === agent && x.label === label);
    const s = agentSeg(agent);
    const seg: TraceSegment = p
      ? { id: node, label: `${humanizeLabel(p.label)} = ${String(p.value ?? "n/a")}`, op: `read from ${p.source}`, provenance: p.provenance }
      : { id: node, label, op: "not in this run's evidence" };
    // Reverse trace: from the figure up to what it moved.
    return s ? [seg, { ...s, op: `this figure fed the ${AGENT_LABELS[agent as keyof typeof AGENT_LABELS] ?? agent} read; ${s.op}` }, score, head] : [seg, score, head];
  }
  return [head];
}

export function threadIds(segments: TraceSegment[]): Set<string> {
  return new Set(segments.map((s) => s.id));
}
