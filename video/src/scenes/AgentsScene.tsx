// Scene 1.2 — five specialist agents in parallel. Uses the REAL product
// primitives (panels.tsx PanelHeader/Row, ProvenanceBadge) fed the REAL recorded
// ledger (EXAMPLE_LEDGER), grouped by agent. Panels arrive on a perspective move.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { PanelHeader, Row, panelStyle } from "@/components/dashboard/panels";
import { AGENT_LABELS } from "@/components/ui/verdict";
import { EXAMPLE_LEDGER } from "@/components/marketing/exampleVerdict";
import { ease } from "../lib/motion";
import { SANS } from "../lib/ui";

const ORDER = [
  "market-timing",
  "infrastructure",
  "demand-sentiment",
  "risk-volatility",
  "regulatory-policy",
] as const;

type LedgerRow = { agent: string; label: string; value: string | number };

const byAgent = (agent: string): LedgerRow[] =>
  (EXAMPLE_LEDGER as LedgerRow[]).filter((d) => d.agent === agent).slice(0, 3);

export const AgentsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const header = {
    opacity: ease(frame, [0, 12], [0, 1]),
    transform: `translateY(${ease(frame, [0, 12], [16, 0])}px)`,
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "var(--white)",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 40,
      }}
    >
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 40,
          letterSpacing: "-0.02em",
          color: "var(--ink-primary)",
          ...header,
        }}
      >
        Five specialist agents, working in parallel.
      </div>

      <div style={{ display: "flex", gap: 20, perspective: 1400, alignItems: "flex-start" }}>
        {ORDER.map((agent, i) => {
          const start = 10 + i * 4;
          const opacity = ease(frame, [start, start + 14], [0, 1]);
          const ty = ease(frame, [start, start + 14], [34, 0]);
          const rot = ease(frame, [start, start + 14], [10, 0]);
          const rows = byAgent(agent);
          return (
            <div
              key={agent}
              style={{
                width: 320,
                opacity,
                transform: `translateY(${ty}px) rotateX(${rot}deg)`,
                transformOrigin: "center top",
              }}
            >
              <div style={{ ...panelStyle, minHeight: 190 }}>
                <PanelHeader title={AGENT_LABELS[agent]} provenance="live" />
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {rows.map((r) => (
                    <Row key={r.label} label={r.label} value={r.value} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
