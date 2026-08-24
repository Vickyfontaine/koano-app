"use client";

// VerdictMathPanel — the verdict, with its arithmetic shown.
//
// KOANO's verdict is decided by a deterministic aggregator, not the LLM
// (lib/agents/synthesis.ts): each specialist casts a directional vote, weighted
// by its own confidence; the weighted votes are averaged into a single score;
// the score falls into a threshold band that names the verdict. This panel
// renders that exact computation from the `weighting_breakdown` the pipeline
// already produces — nothing here is invented or re-derived. Identical data
// gives an identical picture. This is the open answer to a black-box score.

import React from "react";
import ScoreBands, { type ScoreBand } from "./charts/ScoreBands";
import DivergingBar, { type DivergingDatum } from "./charts/DivergingBar";
import {
  AGENT_LABELS,
  VERDICT_COLORS,
  breakdownFromSummaries,
  type AgentName,
  type Provenance,
  type SynthesisResult,
  type Verdict,
} from "./verdict";

// The panel needs only these fields. A fresh SynthesisResult satisfies it; a
// persisted history verdict (no stored weighting_breakdown) also satisfies it and
// gets its math reconstructed from agent_summaries.
interface VerdictMathPanelProps {
  verdict: Pick<SynthesisResult, "verdict" | "overall_provenance" | "agent_summaries"> & {
    weighting_breakdown?: SynthesisResult["weighting_breakdown"] | null;
  };
}

const DOMAIN: [number, number] = [-2, 2];

const monoLabel: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: "10px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--ink-faint)",
};

function agentLabel(agent: string): string {
  return AGENT_LABELS[agent as AgentName] ?? agent;
}

// Proper typographic minus, fixed decimals, explicit + for positives.
// A value that rounds to zero (a neutral/hold vote) carries no sign.
function fmtSigned(n: number, dp = 2): string {
  const s = Math.abs(n).toFixed(dp);
  if (Number(s) === 0) return (0).toFixed(dp);
  return n < 0 ? `−${s}` : `+${s}`;
}

// Plain number with a typographic minus (no forced +), for thresholds/score.
function fmtNum(n: number, dp = 1): string {
  const s = n.toFixed(dp);
  return s.startsWith("-") ? `−${s.slice(1)}` : s;
}

// A compact provenance dot for dense chart rows (the full pill stays where
// there is room — the card and the reasoning chain).
function ProvDot({ provenance }: { provenance: Provenance }) {
  const color =
    provenance === "live"
      ? "var(--signal-positive)"
      : provenance === "representative"
        ? "var(--signal-warning)"
        : "var(--ink-faint)";
  const title =
    provenance === "live" ? "Live data" : provenance === "representative" ? "Representative data" : "Modeled";
  return (
    <span
      title={title}
      aria-label={title}
      style={{
        display: "inline-block",
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export default function VerdictMathPanel({ verdict }: VerdictMathPanelProps) {
  // Fresh pipeline verdicts carry the live-computed breakdown. Persisted-history
  // verdicts don't (it isn't stored) — but it's a PURE function of the stored
  // agent_summaries, so we RE-DERIVE it (breakdownFromSummaries marks it
  // reconstructed:true, surfaced below). Same arithmetic, same stored inputs.
  const wb =
    verdict.weighting_breakdown && verdict.weighting_breakdown.agents.length > 0
      ? verdict.weighting_breakdown
      : verdict.agent_summaries && verdict.agent_summaries.length > 0
        ? breakdownFromSummaries(verdict.agent_summaries, verdict.verdict as Verdict)
        : null;
  if (!wb || wb.agents.length === 0) return null;

  const provByAgent = new Map(verdict.agent_summaries.map((s) => [s.agent, s.overall_provenance]));
  const totalWeight = wb.total_weight;

  // A neutral (hold) vote has direction 0 → zero contribution: it moved nothing,
  // however confident it was. Splitting movers from neutrals is the point of the
  // panel — a reader should see how many agents actually set the verdict.
  const contribs = wb.agents.map((a) => ({
    agent: a.agent,
    verdict: a.verdict,
    confidence: a.confidence,
    normalized: a.contribution / totalWeight,
    prov: provByAgent.get(a.agent) ?? verdict.overall_provenance,
    isNeutral: a.direction === 0,
  }));
  const movers = contribs.filter((c) => !c.isNeutral).sort((a, b) => b.normalized - a.normalized);
  const neutrals = contribs.filter((c) => c.isNeutral).sort((a, b) => b.confidence - a.confidence);

  // Movers first (biggest positive → biggest negative), then the neutrals.
  const rows: DivergingDatum[] = [...movers, ...neutrals].map((a) => ({
    key: a.agent,
    label: agentLabel(a.agent),
    sublabel: `${a.verdict} · conf ${a.confidence}`,
    value: a.normalized,
    color: VERDICT_COLORS[a.verdict] ?? "var(--ink-muted)",
    muted: a.prov === "representative",
    neutral: a.isNeutral,
    valueLabel: a.isNeutral ? undefined : fmtSigned(a.normalized),
    badge: <ProvDot provenance={a.prov} />,
  }));

  // The one-line finding: how many agents actually moved this verdict.
  const total = contribs.length;
  const moverNames = joinNames(movers.map((m) => agentLabel(m.agent)));
  const maxNeutralConf = neutrals.length ? Math.max(...neutrals.map((n) => n.confidence)) : 0;
  let finding: string;
  let findingDetail: string;
  if (movers.length === 0) {
    finding = "No directional signal.";
    findingDetail = `All ${total} specialists returned a neutral (hold) call, so the score is 0.00 — hold.`;
  } else if (neutrals.length === 0) {
    finding = `Decided by all ${total} agents.`;
    findingDetail = `Every specialist returned a directional call; their confidence-weighted shares sum to the score above.`;
  } else {
    finding = `Decided by ${movers.length} of ${total} agents.`;
    findingDetail =
      `${moverNames} set the direction. The other ${neutrals.length} returned no directional signal — ` +
      `a neutral (hold) vote carries no weight, regardless of its confidence (up to ${maxNeutralConf} here). ` +
      `The ${movers.length} directional share${movers.length > 1 ? "s" : ""} sum to the score above.`;
  }

  const sumContrib = wb.agents.reduce((s, a) => s + a.contribution, 0);

  const bands: ScoreBand[] = [
    { from: DOMAIN[0], to: wb.thresholds.wait, label: "sell", color: VERDICT_COLORS.sell },
    { from: wb.thresholds.wait, to: wb.thresholds.hold, label: "wait", color: VERDICT_COLORS.wait },
    { from: wb.thresholds.hold, to: wb.thresholds.buy, label: "hold", color: VERDICT_COLORS.hold },
    { from: wb.thresholds.buy, to: DOMAIN[1], label: "buy", color: VERDICT_COLORS.buy },
  ];

  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        borderRadius: "20px",
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={monoLabel}>How this verdict was computed</div>
          {wb.reconstructed && (
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "10px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--ink-muted)",
                background: "var(--pale-wash)",
                border: "1px solid var(--border)",
                borderRadius: "100px",
                padding: "2px 9px",
              }}
              title="This verdict's breakdown was not stored; it is re-derived now from the same stored agent votes. Identical arithmetic — but a re-derivation, not the original live computation."
            >
              Reconstructed from stored inputs
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: "14px",
            lineHeight: 1.6,
            color: "var(--ink-secondary)",
            margin: "10px 0 0",
            maxWidth: "660px",
          }}
        >
          Each specialist casts a directional vote, weighted by its own confidence. The weighted
          votes average into one score, which falls into a threshold band that names the verdict.
          It is deterministic code, not a judgment call — the same data always produces this exact
          result.
        </p>
      </div>

      {/* The rollup: where the score lands against the thresholds */}
      <div>
        <div style={{ ...monoLabel, marginBottom: "14px" }}>The score, against the thresholds</div>
        <ScoreBands
          domain={DOMAIN}
          bands={bands}
          score={wb.aggregate_score}
          verdictLabel={verdict.verdict}
          verdictColor={VERDICT_COLORS[verdict.verdict] ?? "var(--ink-primary)"}
          ticks={[DOMAIN[0], wb.thresholds.wait, wb.thresholds.hold, wb.thresholds.buy, DOMAIN[1]]}
        />
      </div>

      {/* The decomposition: which agents actually set the verdict, and which
          returned no directional signal despite their confidence. */}
      <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "20px" }}>
        <div style={{ ...monoLabel, marginBottom: "10px" }}>Where the score came from</div>
        <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--ink-primary)", margin: "0 0 4px" }}>
          {finding}
        </p>
        <p style={{ fontSize: "13px", lineHeight: 1.55, color: "var(--ink-muted)", margin: "0 0 18px", maxWidth: "660px" }}>
          {findingDetail}
        </p>
        <DivergingBar data={rows} domain={DOMAIN} />
      </div>

      {/* The arithmetic, in plain terms */}
      <div
        style={{
          borderTop: "1px solid var(--border-light)",
          paddingTop: "16px",
          fontFamily: "'DM Mono', monospace",
          fontSize: "12px",
          lineHeight: 1.7,
          color: "var(--ink-secondary)",
        }}
      >
        <div>
          Σ weighted votes {fmtSigned(sumContrib, 0)} ÷ Σ confidence {totalWeight} ={" "}
          <span style={{ color: "var(--ink-primary)", fontWeight: 500 }}>
            {fmtNum(wb.aggregate_score, 2)}
          </span>{" "}
          →{" "}
          <span
            style={{
              color: VERDICT_COLORS[verdict.verdict] ?? "var(--ink-primary)",
              fontWeight: 500,
              textTransform: "uppercase",
            }}
          >
            {verdict.verdict}
          </span>
        </div>
        <div style={{ color: "var(--ink-faint)", marginTop: "4px" }}>
          thresholds — buy ≥ {fmtNum(wb.thresholds.buy)} · hold ≥ {fmtNum(wb.thresholds.hold)} · wait ≥{" "}
          {fmtNum(wb.thresholds.wait)} · else sell · method {wb.method}
        </div>
      </div>
    </div>
  );
}
