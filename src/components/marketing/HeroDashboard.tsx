"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AGENT_LABELS,
  SPECIALIST_AGENTS,
  type Verdict,
} from "@/components/ui/verdict";
import { EXAMPLE_VERDICT, EXAMPLE_VERDICT_ADDRESS } from "./exampleVerdict";

const EASE = [0.16, 1, 0.3, 1] as const;

// One real, sourced datapoint per agent (verbatim from EXAMPLE_LEDGER — the same
// recorded 175 3rd St run). Shown as each agent's headline signal; nothing invented.
const AGENT_TAG: Record<string, string> = {
  "market-timing": "HPI +5.6% YoY",
  infrastructure: "675 permits in tract",
  "demand-sentiment": "Median income $165K",
  "risk-volatility": "Flood zone X · very low",
  "regulatory-policy": "97% unused FAR",
};

const VCHIP: Record<Verdict, { color: string; bg: string }> = {
  buy: { color: "var(--signal-positive)", bg: "rgba(34,197,94,0.12)" },
  hold: { color: "var(--mid-blue)", bg: "rgba(90,155,190,0.14)" },
  wait: { color: "var(--signal-warning)", bg: "rgba(245,158,11,0.14)" },
  sell: { color: "var(--signal-negative)", bg: "rgba(239,68,68,0.12)" },
  drop: { color: "var(--signal-negative)", bg: "rgba(239,68,68,0.12)" },
};

// Ordered reading list, each row built from the real recorded summary + tag.
const AGENTS = SPECIALIST_AGENTS.map((a) => {
  const s = EXAMPLE_VERDICT.agent_summaries.find((x) => x.agent === a)!;
  return { key: a, name: AGENT_LABELS[a], verdict: s.verdict, conf: s.confidence, tag: AGENT_TAG[a] };
});

const DRIVER = EXAMPLE_VERDICT.weighting_breakdown.structural_drivers?.[0] ?? "";

// Loop timeline (ms): resolve → agents stream in → synthesize → verdict → reset.
const STEPS: Array<[number, number]> = [
  [0, 0], [1, 500], [2, 850], [3, 1200], [4, 1550], [5, 1900], [6, 2650], [0, 6400],
];
const CYCLE_MS = 6800;

const rowVar = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

export default function HeroDashboard() {
  const [cycle, setCycle] = useState(0);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = STEPS.map(([s, ms]) => setTimeout(() => setStage(s), ms));
    timers.push(setTimeout(() => setCycle((c) => c + 1), CYCLE_MS));
    return () => timers.forEach(clearTimeout);
  }, [cycle]);

  const done = stage >= 6;
  const status =
    stage === 0 ? "Resolving address" : stage < 5 ? "Five agents reading the record" : stage < 6 ? "Synthesizing" : "Verdict ready";

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "460px",
        background: "var(--white)",
        borderRadius: "20px",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 40px 80px -30px rgba(0,0,0,0.6)",
        padding: "22px",
        fontFamily: "inherit",
      }}
    >
      {/* Header: address + live status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-faint)",
              marginBottom: "4px",
            }}
          >
            Subject property
          </div>
          <div style={{ fontSize: "15px", fontWeight: 500, color: "var(--ink-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {EXAMPLE_VERDICT_ADDRESS}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", flexShrink: 0 }}>
          <motion.span
            animate={{ opacity: done ? 1 : [0.35, 1, 0.35] }}
            transition={done ? { duration: 0.3 } : { duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: "7px", height: "7px", borderRadius: "50%", background: done ? "var(--signal-positive)" : "var(--mid-blue)" }}
          />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.06em", color: "var(--ink-muted)" }}>
            {status}
          </span>
        </div>
      </div>

      <div style={{ height: "1px", background: "var(--border-light)", margin: "16px 0 6px" }} />

      {/* Five specialist agents streaming in */}
      <div>
        {AGENTS.map((a, i) => {
          const chip = VCHIP[a.verdict as Verdict];
          return (
            <motion.div
              key={a.key}
              initial="hidden"
              animate={stage >= i + 1 ? "visible" : "hidden"}
              variants={rowVar}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "9px 0", borderBottom: "1px solid var(--border-light)" }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--ink-primary)", lineHeight: 1.25 }}>{a.name}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>{a.tag}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--ink-faint)" }}>{a.conf}%</span>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "10px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: chip.color,
                    background: chip.bg,
                    borderRadius: "100px",
                    padding: "3px 10px",
                  }}
                >
                  {a.verdict}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Synthesis verdict */}
      <motion.div
        initial="hidden"
        animate={done ? "visible" : "hidden"}
        variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}
        style={{
          marginTop: "14px",
          background: "var(--pale-wash)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "16px 18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: "3px" }}>
              Synthesis · one verdict
            </div>
            <div style={{ fontSize: "34px", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1, color: "var(--signal-positive)" }}>
              {(EXAMPLE_VERDICT.verdict as string).toUpperCase()}
            </div>
          </div>
          <div style={{ textAlign: "right", fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--ink-secondary)", lineHeight: 1.7 }}>
            <div><b style={{ color: "var(--ink-primary)" }}>{EXAMPLE_VERDICT.confidence}</b> confidence</div>
            <div><b style={{ color: "var(--ink-primary)" }}>{EXAMPLE_VERDICT.risk_score}</b> risk</div>
            <div><b style={{ color: "var(--ink-primary)" }}>{EXAMPLE_VERDICT.signal_window_months}mo</b> window</div>
          </div>
        </div>
        <div style={{ fontSize: "12.5px", color: "var(--ink-secondary)", lineHeight: 1.5, marginTop: "12px" }}>{DRIVER}</div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "12px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--signal-positive)" }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.06em", color: "var(--ink-muted)" }}>
            Live · every figure sourced
          </span>
        </div>
      </motion.div>
    </div>
  );
}
