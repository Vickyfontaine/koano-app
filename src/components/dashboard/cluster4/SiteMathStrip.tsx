"use client";

// SiteMathStrip — Cluster 4 small-multiples: the three sites' verdict math side
// by side, so the ranking is visibly reproducible rather than a table assertion.
// Each column is a compact DivergingBar of the same per-agent contributions the
// full VerdictMathPanel shows, on a shared [-2, 2] domain so magnitudes compare
// directly across sites.

import React from "react";
import DivergingBar, { type DivergingDatum } from "@/components/ui/charts/DivergingBar";
import {
  VERDICT_COLORS,
  breakdownFromSummaries,
  type SynthesisResult,
  type Verdict,
} from "@/components/ui/verdict";

export interface StripSite {
  label: string; // "Site A"
  rank: number;
  verdict: SynthesisResult;
}

const SHORT: Record<string, string> = {
  "market-timing": "Market",
  infrastructure: "Infra",
  "demand-sentiment": "Demand",
  "risk-volatility": "Risk",
  "regulatory-policy": "Reg",
};

const DOMAIN: [number, number] = [-2, 2];

function fmtSigned(n: number): string {
  const s = (Math.round(n * 100) / 100).toFixed(2);
  return n > 0 ? `+${s}` : s.replace("-", "−");
}

function rowsFor(v: SynthesisResult): { rows: DivergingDatum[]; score: number } {
  const wb =
    v.weighting_breakdown && v.weighting_breakdown.agents.length > 0
      ? v.weighting_breakdown
      : breakdownFromSummaries(v.agent_summaries, v.verdict as Verdict);
  const tw = wb.total_weight || 1;
  const rows = wb.agents
    .map((a) => ({
      key: a.agent,
      label: SHORT[a.agent] ?? a.agent,
      value: a.contribution / tw,
      color: VERDICT_COLORS[a.verdict] ?? "var(--ink-muted)",
      neutral: a.direction === 0,
      valueLabel: a.direction === 0 ? undefined : fmtSigned(a.contribution / tw),
    }))
    .sort((a, b) => b.value - a.value);
  return { rows, score: wb.aggregate_score };
}

const mono: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: "10px",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--ink-faint)",
};

export default function SiteMathStrip({ sites }: { sites: StripSite[] }) {
  if (sites.length === 0) return null;
  return (
    <div>
      <div style={{ ...mono, marginBottom: "10px" }}>Verdict math, side by side</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(sites.length, 3)}, minmax(0, 1fr))`,
          gap: "18px",
        }}
      >
        {sites.map((s) => {
          const { rows, score } = rowsFor(s.verdict);
          const vColor = VERDICT_COLORS[s.verdict.verdict as Verdict] ?? "var(--ink-primary)";
          return (
            <div
              key={s.label}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                minWidth: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span style={{ ...mono, color: "var(--brand-blue)" }}>#{s.rank}</span>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--ink-primary)" }}>{s.label}</span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "12px",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    color: vColor,
                  }}
                >
                  {s.verdict.verdict}
                </span>
              </div>
              <DivergingBar data={rows} domain={DOMAIN} barHeight={16} labelWidth={78} />
              <div style={{ ...mono, color: "var(--ink-muted)" }}>
                score {fmtSigned(score)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
