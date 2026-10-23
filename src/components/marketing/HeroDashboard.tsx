"use client";

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AGENT_LABELS,
  SPECIALIST_AGENTS,
  VERDICT_COLORS,
  type Verdict,
} from "@/components/ui/verdict";
import { EXAMPLE_VERDICT, EXAMPLE_VERDICT_ADDRESS, EXAMPLE_VERDICT_LABEL } from "./exampleVerdict";

const EASE = [0.16, 1, 0.3, 1] as const;

// One real, sourced datapoint per agent (verbatim from EXAMPLE_LEDGER — the same
// recorded 175 3rd St run). Shown as each agent's headline signal; nothing invented.
const AGENT_TAG: Record<string, string> = {
  "market-timing": "HPI +5.6% YoY",
  infrastructure: "675 permits in tract",
  "demand-sentiment": "Mortgage denials 31.9%",
  "risk-volatility": "Flood zone X · very low",
  "regulatory-policy": "97% unused FAR",
};

const VCHIP: Record<Verdict, { color: string; bg: string }> = {
  buy: { color: "var(--signal-positive-ink)", bg: "rgba(34,197,94,0.12)" },
  hold: { color: "var(--mid-blue-ink)", bg: "rgba(90,155,190,0.14)" },
  wait: { color: "var(--signal-warning-ink)", bg: "rgba(245,158,11,0.14)" },
  sell: { color: "var(--signal-negative-ink)", bg: "rgba(239,68,68,0.12)" },
  drop: { color: "var(--signal-negative-ink)", bg: "rgba(239,68,68,0.12)" },
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
  // A user-operable pause (WCAG 2.2.2): pausing freezes the current frame;
  // resuming restarts the replay from the top.
  const [paused, setPaused] = useState(false);
  // Reduced motion: no replay loop, no pulse; the finished state renders once.
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      setStage(6);
      return;
    }
    if (paused) return;
    const timers = STEPS.map(([s, ms]) => setTimeout(() => setStage(s), ms));
    timers.push(setTimeout(() => setCycle((c) => c + 1), CYCLE_MS));
    return () => timers.forEach(clearTimeout);
  }, [cycle, reduceMotion, paused]);

  function togglePause() {
    if (paused) {
      setPaused(false);
      setStage(0);
      setCycle((c) => c + 1);
    } else {
      setPaused(true);
    }
  }

  const done = stage >= 6;
  const status = paused
    ? "Paused"
    : stage === 0
      ? "Resolving address"
      : stage < 5
        ? "Five agents reading the record"
        : stage < 6
          ? "Synthesizing"
          : "Verdict ready";

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "460px",
        // A SOLID white card (CLAUDE.md §10): glass over a render blurred the
        // buildings into the chips and made BUY/HOLD illegible (A4). Solid
        // white with the navy-tinted raised shadow reads on the sky render.
        background: "var(--white)",
        borderRadius: "var(--radius-card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-hover)",
        padding: "var(--space-5)",
        fontFamily: "inherit",
        // The card is already centered in the hero section, but the fixed nav
        // overlaps the top ~64px, so it reads high. Nudge down half the nav
        // height (32px) so the clear space above and below appears equal.
        // Transform only — no layout shift, no horizontal move.
        transform: "translateY(var(--space-6))",
      }}
    >
      {/* Header: address + live status */}
      <div className="hero-card-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-micro)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-muted)",
              marginBottom: "var(--space-1)",
            }}
          >
            Recorded example
          </div>
          <div style={{ fontSize: "var(--text-ui)", fontWeight: 500, color: "var(--ink-primary)", lineHeight: 1.3 }}>
            {EXAMPLE_VERDICT_ADDRESS}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
          {!reduceMotion && (
            <button
              type="button"
              onClick={togglePause}
              aria-pressed={paused}
              aria-label={paused ? "Play the replay" : "Pause the replay"}
              title={paused ? "Play" : "Pause"}
              style={{
                width: "44px",
                height: "44px",
                margin: "-12px 0 -12px -8px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: 0,
                background: "transparent",
                color: "var(--ink-muted)",
                cursor: "pointer",
                borderRadius: "50%",
              }}
            >
              {paused ? (
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <path d="M3 1.5v11l9-5.5z" fill="currentColor" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <rect x="2.5" y="1.5" width="3" height="11" fill="currentColor" />
                  <rect x="8.5" y="1.5" width="3" height="11" fill="currentColor" />
                </svg>
              )}
            </button>
          )}
          <motion.span
            animate={{ opacity: done || reduceMotion || paused ? 1 : [0.35, 1, 0.35] }}
            transition={done || reduceMotion || paused ? { duration: 0.3 } : { duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: "7px", height: "7px", borderRadius: "50%", background: done ? "var(--signal-positive)" : "var(--mid-blue)" }}
          />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", letterSpacing: "0.06em", color: "var(--ink-muted)" }}>
            {status}
          </span>
        </div>
      </div>

      <div style={{ height: "1px", background: "var(--border-light)", margin: "var(--space-4) 0 var(--space-2)" }} />

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
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--border-light)" }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "var(--text-body)", fontWeight: 500, color: "var(--ink-primary)", lineHeight: 1.25 }}>{a.name}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--ink-muted)", marginTop: "var(--space-1)" }}>{a.tag}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--ink-muted)" }}>{a.conf}%</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-micro)",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: chip.color,
                    background: chip.bg,
                    borderRadius: "100px",
                    padding: "var(--space-1) var(--space-3)",
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
          marginTop: "var(--space-4)",
          background: "var(--pale-wash)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-inner)",
          padding: "var(--space-4) var(--space-4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-3)" }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: "var(--space-1)" }}>
              Synthesis · one verdict
            </div>
            <div style={{ fontSize: "var(--text-h1)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1, color: VERDICT_COLORS[EXAMPLE_VERDICT.verdict] }}>
              {(EXAMPLE_VERDICT.verdict as string).toUpperCase()}
            </div>
          </div>
          <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--ink-muted)", lineHeight: 1.7 }}>
            <div><b style={{ color: "var(--ink-primary)" }}>{EXAMPLE_VERDICT.confidence}</b> confidence</div>
            <div><b style={{ color: "var(--ink-primary)" }}>{EXAMPLE_VERDICT.risk_score}</b> risk</div>
            <div><b style={{ color: "var(--ink-primary)" }}>{EXAMPLE_VERDICT.signal_window_months}mo</b> window</div>
          </div>
        </div>
        <div style={{ fontSize: "var(--text-data)", color: "var(--ink-secondary)", lineHeight: 1.5, marginTop: "var(--space-3)" }}>{DRIVER}</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", lineHeight: 1.5, letterSpacing: "0.04em", color: "var(--ink-muted)", marginTop: "var(--space-3)" }}>
          {EXAMPLE_VERDICT_LABEL} Replayed at about 30x.
        </div>
      </motion.div>
    </div>
  );
}
