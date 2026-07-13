"use client";

// LoadingState — agent-by-agent pipeline progress (the run takes ~60s).
// Every status shown here reflects a REAL event from /api/agents/stream:
// an agent row flips to complete only when its verdict has actually landed.
// Progress is never simulated.

import React, { useEffect, useState } from "react";
import ProvenanceBadge from "./ProvenanceBadge";
import {
  AGENT_LABELS,
  SPECIALIST_AGENTS,
  type AgentName,
  type Provenance,
  type Verdict,
} from "./verdict";

export interface AgentProgress {
  state: "running" | "complete";
  verdict?: Verdict;
  confidence?: number;
  overall_provenance?: Provenance;
}

export type PipelinePhase = "geocoding" | "agents" | "synthesis";

interface LoadingStateProps {
  phase: PipelinePhase;
  agents: Partial<Record<AgentName, AgentProgress>>;
  startedAt: number; // Date.now() when the run began
  normalizedAddress?: string | null;
}

function Dot({ state }: { state: "pending" | "running" | "complete" }) {
  return (
    <span
      aria-hidden="true"
      className={state === "running" ? "koano-pulse" : undefined}
      style={{
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        flexShrink: 0,
        background:
          state === "complete"
            ? "var(--signal-positive)"
            : state === "running"
              ? "var(--mid-blue)"
              : "var(--border)",
      }}
    />
  );
}

export default function LoadingState({
  phase,
  agents,
  startedAt,
  normalizedAddress,
}: LoadingStateProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.round((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const completed = SPECIALIST_AGENTS.filter((a) => agents[a]?.state === "complete").length;

  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        borderRadius: "20px",
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        maxWidth: "640px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px" }}>
        <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--ink-primary)" }}>
          {phase === "geocoding"
            ? "Resolving address…"
            : phase === "synthesis"
              ? "Synthesizing one verdict from five agents…"
              : `Five agents analyzing — ${completed}/5 complete`}
        </span>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            color: "var(--ink-faint)",
          }}
        >
          {elapsed}s · typically ~60s
        </span>
      </div>

      {normalizedAddress && (
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "12px",
            color: "var(--ink-muted)",
            margin: 0,
          }}
        >
          {normalizedAddress}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {SPECIALIST_AGENTS.map((name) => {
          const p = agents[name];
          const state: "pending" | "running" | "complete" =
            p?.state === "complete" ? "complete" : phase === "geocoding" ? "pending" : "running";
          return (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Dot state={state} />
              <span
                style={{
                  fontSize: "14px",
                  color: state === "pending" ? "var(--ink-faint)" : "var(--ink-secondary)",
                  minWidth: "180px",
                }}
              >
                {AGENT_LABELS[name]}
              </span>
              {p?.state === "complete" && p.verdict ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      color: "var(--ink-primary)",
                    }}
                  >
                    {p.verdict} · {p.confidence}
                  </span>
                  {p.overall_provenance && <ProvenanceBadge provenance={p.overall_provenance} />}
                </span>
              ) : (
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "11px",
                    color: "var(--ink-faint)",
                  }}
                >
                  {state === "pending" ? "waiting" : "analyzing…"}
                </span>
              )}
            </div>
          );
        })}

        {/* Synthesis row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            borderTop: "1px solid var(--border-light)",
            paddingTop: "12px",
          }}
        >
          <Dot state={phase === "synthesis" ? "running" : "pending"} />
          <span
            style={{
              fontSize: "14px",
              color: phase === "synthesis" ? "var(--ink-secondary)" : "var(--ink-faint)",
              minWidth: "180px",
            }}
          >
            {AGENT_LABELS.synthesis}
          </span>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              color: "var(--ink-faint)",
            }}
          >
            {phase === "synthesis" ? "arbitrating…" : "waiting for all five agents"}
          </span>
        </div>
      </div>
    </div>
  );
}
