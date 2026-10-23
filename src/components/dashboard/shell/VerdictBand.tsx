"use client";

// VerdictBand (UI sprint WS3, slice 2; A6). The verdict's one home: the first
// block of the workspace in every lens, at most 40vh. It shows the engine's
// actual state, never a placeholder verdict: empty, resolving, the five
// agents reporting in, the verdict with its figures and a provenance summary
// counted from the verdict's own data points, or the error.

import React, { useEffect, useState } from "react";
import {
  AGENT_LABELS,
  SPECIALIST_AGENTS,
  VERDICT_COLORS,
  PROVENANCE_META,
  type Provenance,
  type Verdict,
} from "@/components/ui/verdict";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import RunDegradationNote from "@/components/ui/RunDegradationNote";
import { useSubject, type DrawerTab } from "./SubjectProvider";

const SHORT_AGENT: Record<string, string> = {
  "market-timing": "Market",
  infrastructure: "Pipeline",
  "demand-sentiment": "Demand",
  "risk-volatility": "Risk",
  "regulatory-policy": "Regulatory",
};

function riskInk(score: number): string {
  return score >= 67 ? "var(--signal-negative-ink)" : score >= 34 ? "var(--signal-warning-ink)" : "var(--signal-positive-ink)";
}
function riskFill(score: number): string {
  return score >= 67 ? "var(--signal-negative)" : score >= 34 ? "var(--signal-warning)" : "var(--signal-positive)";
}

function Elapsed({ since }: { since: number }) {
  const [s, setS] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setS(Math.round((Date.now() - since) / 1000)), 1000);
    return () => clearInterval(id);
  }, [since]);
  return <span className="band-mono">{s}s · typically about 60s</span>;
}

const SUMMARY_LABEL: Record<Provenance, string> = {
  live: "live",
  partner: "partner",
  representative: "representative",
  fetch_failed: "failed to fetch",
  coverage_absent: "not covered",
};

export function provenanceSummary(points: { provenance: Provenance }[]): { state: Provenance; n: number }[] {
  const order: Provenance[] = ["live", "partner", "representative", "fetch_failed", "coverage_absent"];
  const counts = new Map<Provenance, number>();
  for (const p of points) counts.set(p.provenance, (counts.get(p.provenance) ?? 0) + 1);
  return order.filter((s) => counts.has(s)).map((s) => ({ state: s, n: counts.get(s)! }));
}

const TABS: { id: DrawerTab; label: string }[] = [
  { id: "math", label: "Math" },
  { id: "reasoning", label: "Reasoning" },
  { id: "sources", label: "Sources" },
  { id: "coverage", label: "Coverage" },
];

export default function VerdictBand() {
  const { run, openDrawer } = useSubject();
  const status = run?.status ?? "idle";

  return (
    <section className={`verdict-band verdict-band-${status}`} aria-label="Verdict" aria-live="polite" id="verdict-band">
      {status === "idle" && (
        <div className="band-row">
          <div>
            <div className="band-eyebrow">Verdict</div>
            <p className="band-title">No subject yet.</p>
            <p className="band-copy">
              Enter an address below. The five agents read its public record and the verdict lands here, in the same
              place in every lens.
            </p>
          </div>
        </div>
      )}

      {status === "resolving" && (
        <div className="band-row">
          <div>
            <div className="band-eyebrow">Verdict</div>
            <p className="band-title">
              <span className="band-pulse" aria-hidden="true" />
              Resolving the address
            </p>
            {run?.subject && <p className="band-copy band-mono">{run.subject}</p>}
          </div>
        </div>
      )}

      {status === "running" && run && (
        <div className="band-row">
          <div style={{ minWidth: 0, flex: "1 1 auto" }}>
            <div className="band-eyebrow">Verdict</div>
            <p className="band-title">
              <span className="band-pulse" aria-hidden="true" />
              {run.phase === "geocoding"
                ? "Resolving the address"
                : run.phase === "synthesis"
                  ? "Synthesizing one verdict from five agents"
                  : `Five agents reading the record, ${SPECIALIST_AGENTS.filter((a) => run.agents[a]?.state === "complete").length} of 5 in`}
            </p>
            {(run.normalized || run.subject) && <p className="band-copy band-mono">{run.normalized ?? run.subject}</p>}
            <Elapsed since={run.startedAt} />
          </div>
          <ul className="band-agents" aria-label="Agent progress">
            {SPECIALIST_AGENTS.map((a) => {
              const p = run.agents[a];
              const state = p?.state === "complete" ? "complete" : p?.state === "running" ? "running" : "pending";
              return (
                <li key={a} className={`band-agent band-agent-${state}`} title={AGENT_LABELS[a]}>
                  <span className="band-agent-dot" aria-hidden="true" />
                  <span className="band-agent-name">{SHORT_AGENT[a]}</span>
                  {p?.state === "complete" && p.verdict && (
                    <span className="band-agent-verdict" style={{ color: VERDICT_COLORS[p.verdict as Verdict] }}>
                      {p.verdict}
                    </span>
                  )}
                  <span className="sr-only">
                    {AGENT_LABELS[a]}: {state}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {status === "error" && run && (
        <div className="band-row">
          <div>
            <div className="band-eyebrow">Verdict</div>
            <p className="band-title" style={{ color: "var(--signal-negative-ink)" }}>
              The run did not complete.
            </p>
            <p className="band-copy">{run.error}</p>
            <p className="band-copy band-mono">Live NYC data is deepest. Try a New York City street address.</p>
          </div>
        </div>
      )}

      {status === "done" && run?.result && (
        <>
          <div className="band-row band-row-done">
            <div className="band-main">
              <div className="band-eyebrow">
                Verdict
                <ProvenanceBadge provenance={run.result.verdict.overall_provenance} />
              </div>
              <div className="band-word" style={{ color: VERDICT_COLORS[run.result.verdict.verdict] }}>
                {run.result.verdict.verdict}
              </div>
              <p className="band-address">{run.result.resolved_address.normalized}</p>
              <p className="band-headline">{run.result.verdict.headline}</p>
            </div>
            <dl className="band-metrics">
              <div>
                <dt>Confidence</dt>
                <dd>{run.result.verdict.confidence}</dd>
                <span className="band-meter" aria-hidden="true">
                  <span style={{ width: `${run.result.verdict.confidence}%`, background: "var(--mid-blue)" }} />
                </span>
              </div>
              <div>
                <dt>Risk</dt>
                <dd style={{ color: riskInk(run.result.verdict.risk_score) }}>{run.result.verdict.risk_score}</dd>
                <span className="band-meter" aria-hidden="true">
                  <span
                    style={{ width: `${run.result.verdict.risk_score}%`, background: riskFill(run.result.verdict.risk_score) }}
                  />
                </span>
              </div>
              <div>
                <dt>Window</dt>
                <dd>
                  {run.result.verdict.signal_window_months}
                  <span className="band-unit">mo</span>
                </dd>
              </div>
            </dl>
          </div>
          <div className="band-foot">
            <p className="band-summary band-mono">
              {provenanceSummary(run.result.verdict.data_points ?? []).map(({ state, n }, i) => (
                <span key={state}>
                  {i > 0 && " · "}
                  <span style={{ color: PROVENANCE_META[state].color }}>
                    {n} {SUMMARY_LABEL[state]}
                  </span>
                </span>
              ))}
              {run.result.resolved_address.location_confidence === "unconfirmed" && (
                <span style={{ color: "var(--signal-warning-ink)" }}> · location unconfirmed</span>
              )}
              {" · "}
              {run.result.persisted ? "recorded to your history" : `not recorded: ${run.result.persist_error ?? "persistence unavailable"}`}
            </p>
            <div className="band-actions">
              {TABS.map((t) => (
                <button key={t.id} type="button" className="btn-ghost band-btn" onClick={() => openDrawer(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <RunDegradationNote degradation={run.result.degradation} />
        </>
      )}
    </section>
  );
}
