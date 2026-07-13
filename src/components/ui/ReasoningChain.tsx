"use client";

// ReasoningChain — the auditable thinking behind a verdict (Section 07/09).
// Shows all five specialists' conclusions, the full step-by-step chain with
// per-step source citations and provenance, and surfaces minority signals —
// disagreements are never hidden. Expandable: summaries and dissent are
// always visible; the full chain unfolds on demand.

import React, { useState } from "react";
import ProvenanceBadge from "./ProvenanceBadge";
import {
  AGENT_LABELS,
  VERDICT_COLORS,
  swapIntegrationFor,
  type AgentName,
  type MinoritySignal,
  type ReasoningStep,
  type SynthesisResult,
} from "./verdict";

interface ReasoningChainProps {
  reasoningChain: ReasoningStep[];
  minoritySignals: MinoritySignal[];
  agentSummaries?: SynthesisResult["agent_summaries"];
}

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

export default function ReasoningChain({
  reasoningChain,
  minoritySignals,
  agentSummaries,
}: ReasoningChainProps) {
  const [expanded, setExpanded] = useState(false);

  // Group steps by agent, preserving chain order (specialists first, synthesis last).
  const groups: { agent: string; steps: ReasoningStep[] }[] = [];
  for (const step of reasoningChain) {
    const last = groups[groups.length - 1];
    if (last && last.agent === step.agent) last.steps.push(step);
    else groups.push({ agent: step.agent, steps: [step] });
  }

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
      {/* Agent conclusions — always visible */}
      {agentSummaries && agentSummaries.length > 0 && (
        <div>
          <div style={{ ...monoLabel, marginBottom: "12px" }}>Agent conclusions</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: "12px",
            }}
          >
            {agentSummaries.map((s) => (
              <div
                key={s.agent}
                style={{
                  border: "1px solid var(--border-light)",
                  borderRadius: "12px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink-secondary)" }}>
                  {agentLabel(s.agent)}
                </span>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "15px",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    color:
                      VERDICT_COLORS[s.verdict as keyof typeof VERDICT_COLORS] ??
                      "var(--ink-primary)",
                  }}
                >
                  {s.verdict} · {s.confidence}
                </span>
                <ProvenanceBadge provenance={s.overall_provenance} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Minority signals — conflicts are surfaced, never hidden */}
      {minoritySignals.length > 0 && (
        <div
          style={{
            borderLeft: "3px solid var(--signal-warning)",
            background: "rgba(245, 158, 11, 0.05)",
            borderRadius: "0 12px 12px 0",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <span style={monoLabel}>
            Minority signals — {minoritySignals.length}
          </span>
          {minoritySignals.map((m, i) => (
            <div key={i} style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--ink-secondary)" }}>
              <span style={{ fontWeight: 500, color: "var(--ink-primary)" }}>
                {agentLabel(m.agent)}:
              </span>{" "}
              {m.signal}
              {m.note && (
                <span style={{ color: "var(--ink-muted)" }}> — {m.note}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        style={{
          alignSelf: "flex-start",
          border: "1px solid var(--border)",
          background: "transparent",
          borderRadius: "100px",
          padding: "9px 20px",
          fontFamily: "inherit",
          fontSize: "13px",
          fontWeight: 500,
          color: "var(--ink-primary)",
          cursor: "pointer",
        }}
      >
        {expanded
          ? "Hide reasoning chain"
          : `View full reasoning chain — ${reasoningChain.length} steps`}
      </button>

      {/* Full chain — per-step citations + provenance */}
      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {groups.map((g, gi) => (
            <div key={gi}>
              <div style={{ ...monoLabel, marginBottom: "10px", color: "var(--brand-blue)" }}>
                {agentLabel(g.agent)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {g.steps.map((step) => {
                  const swap =
                    step.provenance === "representative"
                      ? swapIntegrationFor(step.sources)
                      : null;
                  return (
                    <div
                      key={step.step}
                      style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}
                    >
                      <span
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: "11px",
                          color: "var(--ink-faint)",
                          minWidth: "24px",
                          paddingTop: "3px",
                        }}
                      >
                        {String(step.step).padStart(2, "0")}
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                        <p
                          style={{
                            fontSize: "14px",
                            lineHeight: 1.6,
                            color: "var(--ink-secondary)",
                            margin: 0,
                          }}
                        >
                          {step.observation}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            flexWrap: "wrap",
                          }}
                        >
                          {step.sources.map((s, si) => (
                            <span
                              key={si}
                              style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: "10px",
                                letterSpacing: "0.04em",
                                color: "var(--ink-muted)",
                                background: "var(--pale-wash)",
                                border: "1px solid var(--border-light)",
                                borderRadius: "100px",
                                padding: "2px 9px",
                              }}
                            >
                              {s}
                            </span>
                          ))}
                          <ProvenanceBadge
                            provenance={step.provenance}
                            becomesLiveWith={swap}
                            showNote={step.provenance !== "live" && !!swap}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
