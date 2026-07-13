"use client";

// VerdictCard — the unified KOANO verdict: verdict word, confidence, signal
// window, headline, risk score. The overall provenance badge is mandatory —
// a verdict is only as live as its weakest input (Section 06, rule 3).

import React from "react";
import ProvenanceBadge from "./ProvenanceBadge";
import {
  VERDICT_COLORS,
  swapIntegrationFor,
  type SynthesisResult,
} from "./verdict";

interface VerdictCardProps {
  verdict: SynthesisResult;
  /** Normalized address the verdict is about. */
  address?: string;
}

function Meter({ value, color }: { value: number; color: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height: "4px",
        borderRadius: "2px",
        background: "var(--border-light)",
        overflow: "hidden",
        marginTop: "8px",
      }}
    >
      <div
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          height: "100%",
          borderRadius: "2px",
          background: color,
        }}
      />
    </div>
  );
}

const metricLabel: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: "10px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--ink-faint)",
};

const metricValue: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: "20px",
  fontWeight: 500,
  color: "var(--ink-primary)",
};

export default function VerdictCard({ verdict, address }: VerdictCardProps) {
  const color = VERDICT_COLORS[verdict.verdict];
  const overallSwap =
    verdict.overall_provenance === "representative"
      ? swapIntegrationFor(verdict.top_data_sources)
      : null;

  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        borderRadius: "20px",
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* Verdict word + overall provenance */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "14px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "40px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              color,
              lineHeight: 1,
            }}
          >
            {verdict.verdict}
          </span>
          {address && (
            <span style={{ fontSize: "15px", color: "var(--ink-secondary)" }}>{address}</span>
          )}
        </div>
        <ProvenanceBadge provenance={verdict.overall_provenance} />
      </div>

      {/* Headline */}
      <p
        style={{
          fontSize: "18px",
          lineHeight: 1.6,
          color: "var(--ink-primary)",
          margin: 0,
          maxWidth: "640px",
        }}
      >
        {verdict.headline}
      </p>

      {/* Metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "20px",
          borderTop: "1px solid var(--border-light)",
          paddingTop: "20px",
        }}
      >
        <div>
          <div style={metricLabel}>Confidence</div>
          <div style={{ ...metricValue, marginTop: "6px" }}>{verdict.confidence}/100</div>
          <Meter value={verdict.confidence} color="var(--mid-blue)" />
        </div>
        <div>
          <div style={metricLabel}>Signal window</div>
          <div style={{ ...metricValue, marginTop: "6px" }}>
            {verdict.signal_window_months} mo
          </div>
        </div>
        <div>
          <div style={metricLabel}>Risk score</div>
          <div style={{ ...metricValue, marginTop: "6px" }}>{verdict.risk_score}/100</div>
          <Meter
            value={verdict.risk_score}
            color={
              verdict.risk_score >= 67
                ? "var(--signal-negative)"
                : verdict.risk_score >= 34
                  ? "var(--signal-warning)"
                  : "var(--signal-positive)"
            }
          />
        </div>
        {typeof verdict.irr_estimate === "number" && (
          <div>
            <div style={metricLabel}>IRR estimate</div>
            <div style={{ ...metricValue, marginTop: "6px" }}>{verdict.irr_estimate}%</div>
          </div>
        )}
      </div>

      {/* Non-live verdicts carry the full explanatory note (Section 06, rule 4) */}
      {verdict.overall_provenance !== "live" && (
        <div
          style={{
            borderTop: "1px solid var(--border-light)",
            paddingTop: "16px",
          }}
        >
          <ProvenanceBadge
            provenance={verdict.overall_provenance}
            becomesLiveWith={overallSwap}
            showNote
          />
          <p style={{ fontSize: "12px", color: "var(--ink-faint)", margin: "8px 0 0" }}>
            A verdict&apos;s provenance equals its weakest input. Some inputs to this verdict
            are representative stand-ins; the reasoning chain marks each one.
          </p>
        </div>
      )}

      <p
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "11px",
          color: "var(--ink-faint)",
          margin: 0,
        }}
      >
        Generated {new Date(verdict.generated_at).toLocaleString()} · Decision support, not
        financial advice
      </p>
    </div>
  );
}
