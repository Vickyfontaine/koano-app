"use client";

// The Bench (UI sprint WS5): the run as a show, in the verdict band. Every
// mark is a real pipeline event: an agent column seals when its verdict lands
// (its signed vote grows on the rail), the needle sweeps when the computed
// decision arrives (before the narrator writes a word), and the headline
// fills in on completion. Nothing is simulated and nothing is delayed for
// choreography: the only motion is the CSS transition on the marks.

import React, { useEffect, useState } from "react";
import { AGENT_LABELS, SPECIALIST_AGENTS, VERDICT_COLORS, VERDICT_FILLS, type Verdict } from "@/components/ui/verdict";
import DivergingBar, { type DivergingDatum } from "@/components/ui/charts/DivergingBar";
import ScoreBands from "@/components/ui/charts/ScoreBands";
import type { ShellRun } from "./SubjectProvider";

const SHORT: Record<string, string> = {
  "market-timing": "Market",
  infrastructure: "Pipeline",
  "demand-sentiment": "Demand",
  "risk-volatility": "Risk",
  "regulatory-policy": "Regulatory",
};
// Raw signed votes (confidence × direction) range over [-200, 200]; the rail
// shows them on that fixed scale so a bar never re-scales as others land.
const RAIL_DOMAIN: [number, number] = [-200, 200];
const SCORE_DOMAIN: [number, number] = [-2, 2];

function Elapsed({ since }: { since: number }) {
  const [s, setS] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setS(Math.round((Date.now() - since) / 1000)), 1000);
    return () => clearInterval(id);
  }, [since]);
  const m = Math.floor(s / 60);
  return (
    <span aria-hidden="true">
      {m}:{String(s % 60).padStart(2, "0")}
    </span>
  );
}

export default function Bench({ run }: { run: ShellRun }) {
  const agentsIn = SPECIALIST_AGENTS.filter((a) => run.agents[a]?.state === "complete");
  const points = agentsIn.reduce((n, a) => n + (run.agents[a]?.data_point_count ?? 0), 0);
  const live = agentsIn.reduce((n, a) => n + (run.agents[a]?.live_count ?? 0), 0);
  const d = run.decision;

  const rows: DivergingDatum[] = SPECIALIST_AGENTS.map((a) => {
    const p = run.agents[a];
    const done = p?.state === "complete";
    const v = (p?.verdict ?? "hold") as Verdict;
    return {
      key: a,
      label: SHORT[a],
      sublabel: done ? `${p!.verdict} · conf ${p!.confidence}` : "reading",
      value: done ? (p!.contribution ?? 0) : 0,
      color: VERDICT_FILLS[v] ?? "var(--mid-blue)",
      neutral: done ? (p!.contribution ?? 0) === 0 : true,
    };
  });

  const wb = d?.breakdown;
  const bands = wb
    ? [
        { from: SCORE_DOMAIN[0], to: wb.thresholds.wait, label: "sell", color: VERDICT_FILLS.sell, ink: VERDICT_COLORS.sell },
        { from: wb.thresholds.wait, to: wb.thresholds.hold, label: "wait", color: VERDICT_FILLS.wait, ink: VERDICT_COLORS.wait },
        { from: wb.thresholds.hold, to: wb.thresholds.buy, label: "hold", color: VERDICT_FILLS.hold, ink: VERDICT_COLORS.hold },
        { from: wb.thresholds.buy, to: SCORE_DOMAIN[1], label: "buy", color: VERDICT_FILLS.buy, ink: VERDICT_COLORS.buy },
      ]
    : null;
  const finalScore = wb?.final_score ?? wb?.aggregate_score ?? 0;

  const title =
    run.phase === "geocoding"
      ? "Resolving the address"
      : d
        ? "Decision computed. Writing the explanation"
        : run.phase === "synthesis" || run.phase === "narration"
          ? "Five agents in. Computing the verdict"
          : `Five agents reading the record, ${agentsIn.length} of 5 in`;

  return (
    <div className="bench">
      <div className="bench-head">
        <div style={{ minWidth: 0 }}>
          <div className="band-eyebrow">Verdict</div>
          <p className="band-title">
            {!d && <span className="band-pulse" aria-hidden="true" />}
            {title}
          </p>
          {(run.normalized || run.subject) && <p className="band-copy band-mono">{run.normalized ?? run.subject}</p>}
        </div>
        <p className="bench-counters band-mono" aria-label="Run counters">
          <Elapsed since={run.startedAt} /> · {agentsIn.length} of 5 agents · {points} figures read
          {points > 0 ? ` · ${live} live` : ""}
        </p>
      </div>

      {/* Agent columns: each seals when its real verdict lands. */}
      <ul className="bench-cols" aria-label="Agents">
        {SPECIALIST_AGENTS.map((a) => {
          const p = run.agents[a];
          const state = p?.state === "complete" ? "complete" : run.phase === "geocoding" ? "pending" : "running";
          return (
            <li key={a} className={`bench-col bench-col-${state}`} title={AGENT_LABELS[a]}>
              <span className="bench-col-name">
                <span className="band-agent-dot" aria-hidden="true" />
                {SHORT[a]}
              </span>
              {state === "complete" && p?.verdict ? (
                <span className="bench-col-verdict" style={{ color: VERDICT_COLORS[p.verdict as Verdict] }}>
                  {p.verdict}
                  <span className="bench-col-conf">conf {p.confidence}</span>
                </span>
              ) : (
                <span className="bench-col-wait">{state === "pending" ? "waiting" : "reading"}</span>
              )}
              {state === "complete" && p?.data_point_count != null && (
                <span className="bench-col-facts">
                  {p.data_point_count} figures{p.live_count != null ? ` · ${p.live_count} live` : ""}
                </span>
              )}
              <span className="sr-only">
                {AGENT_LABELS[a]}: {state}
              </span>
            </li>
          );
        })}
      </ul>

      {/* The live vote rail: raw signed votes on a fixed scale. */}
      <div className="bench-rail" aria-label="Votes so far">
        <DivergingBar data={rows} domain={RAIL_DOMAIN} barHeight={10} labelWidth={132} tracePrefix="agent:" />
      </div>

      {/* The decision: the needle sweeps when aggregate() returns, before any prose. */}
      {d && bands && (
        <div className="bench-decision">
          <ScoreBands
            domain={SCORE_DOMAIN}
            bands={bands}
            score={finalScore}
            verdictLabel={d.verdict}
            verdictColor={VERDICT_COLORS[d.verdict]}
            ticks={[SCORE_DOMAIN[0], wb!.thresholds.wait, wb!.thresholds.hold, wb!.thresholds.buy, SCORE_DOMAIN[1]]}
          />
          <div className="bench-decision-row">
            <span className="band-word" style={{ color: VERDICT_COLORS[d.verdict] }}>
              {d.verdict}
            </span>
            <span className="band-mono">
              confidence {d.confidence} · risk {d.risk_score} · {d.signal_window_months} mo
              {wb?.structural_nudge ? ` · nudge ${wb.structural_nudge > 0 ? "+" : ""}${wb.structural_nudge}` : ""}
            </span>
          </div>
          {wb?.structural_drivers && wb.structural_drivers.length > 0 && (
            <p className="band-copy" style={{ margin: 0 }}>
              {wb.structural_drivers.join(" · ")}
            </p>
          )}
          <p className="band-copy band-mono" style={{ margin: 0 }}>
            The decision above is computed and will not change.{" "}
            <span className="band-pulse" aria-hidden="true" style={{ display: "inline-block", verticalAlign: "middle" }} /> The narrator is
            writing the explanation.
          </p>
        </div>
      )}
    </div>
  );
}
