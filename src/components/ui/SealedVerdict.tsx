"use client";

// SealedVerdict (UI sprint WS5): the shareable, read-only record page. Shows
// the stored verdict as stored, names what is not stored, and never implies a
// live run. Public-safe: no account controls, no actions.

import React from "react";
import ProvenanceBadge from "./ProvenanceBadge";
import VerdictMathPanel from "./VerdictMathPanel";
import ReasoningChain from "./ReasoningChain";
import { AGENT_LABELS, VERDICT_COLORS, type AgentName, type Verdict, type Provenance, type ReasoningStep, type MinoritySignal } from "./verdict";
import type { WeightingBreakdown, AgentSummary } from "../../../lib/agents/breakdown";

interface SealedRow {
  id: string;
  address_input: string;
  address_normalized: string | null;
  bbl: string | null;
  verdict: string;
  confidence: number;
  risk_score: number;
  signal_window_months: number;
  headline: string;
  overall_provenance: string;
  reasoning_chain: unknown;
  minority_signals: unknown;
  agent_summaries: AgentSummary[];
  created_at: string;
  weighting_breakdown: WeightingBreakdown | null;
}

function riskInk(score: number): string {
  return score >= 67 ? "var(--signal-negative-ink)" : score >= 34 ? "var(--signal-warning-ink)" : "var(--signal-positive-ink)";
}

export default function SealedVerdict({ row, owner }: { row: SealedRow; owner: boolean }) {
  const verdict = row.verdict as Verdict;
  const prov = row.overall_provenance as Provenance;
  const chain = Array.isArray(row.reasoning_chain) ? (row.reasoning_chain as ReasoningStep[]) : [];
  const minority = Array.isArray(row.minority_signals) ? (row.minority_signals as MinoritySignal[]) : [];
  const when = new Date(row.created_at);
  return (
    <div className="sealed">
      <header className="sealed-head">
        <a href="/" className="shell-topbar-logo" aria-label="KOANO home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="KOANO" width={40} height={40} />
        </a>
        <span className="sealed-tag">Sealed verdict record</span>
        {owner && (
          <a href="/dashboard" className="btn-ghost" style={{ marginLeft: "auto" }}>
            Back to the dashboard
          </a>
        )}
      </header>

      <main className="sealed-main">
        <section className="verdict-band verdict-band-done" aria-label="Verdict">
          <div className="band-row band-row-done">
            <div className="band-main">
              <div className="band-eyebrow">
                Verdict
                <ProvenanceBadge provenance={prov} />
              </div>
              <div className="band-word" style={{ color: VERDICT_COLORS[verdict] ?? "var(--ink-primary)" }}>
                {row.verdict}
              </div>
              <p className="band-address">
                {row.address_normalized ?? row.address_input}
                {row.bbl ? ` · BBL ${row.bbl}` : ""}
              </p>
              <p className="band-headline">{row.headline}</p>
            </div>
            <dl className="band-metrics">
              <div>
                <dt>Confidence</dt>
                <dd>{row.confidence}</dd>
              </div>
              <div>
                <dt>Risk</dt>
                <dd style={{ color: riskInk(row.risk_score) }}>{row.risk_score}</dd>
              </div>
              <div>
                <dt>Window</dt>
                <dd>
                  {row.signal_window_months}
                  <span className="band-unit">mo</span>
                </dd>
              </div>
            </dl>
          </div>
          <div className="band-foot">
            <p className="band-summary band-mono">
              Recorded {when.toLocaleDateString()} {when.toLocaleTimeString()} · append-only record · decision support, not financial advice
            </p>
          </div>
        </section>

        <section className="sealed-panel" aria-label="Agent votes">
          <h2 className="sealed-h2">Five specialists, one verdict</h2>
          <ul className="sealed-agents">
            {row.agent_summaries.map((a) => (
              <li key={a.agent} className="sealed-agent">
                <span className="sealed-agent-name">{AGENT_LABELS[a.agent as AgentName] ?? a.agent}</span>
                <span className="sealed-agent-vote" style={{ color: VERDICT_COLORS[a.verdict as Verdict] ?? "var(--ink-primary)" }}>
                  {a.verdict.toUpperCase()} · conf {a.confidence}
                </span>
                <span className="sealed-agent-head">{a.headline}</span>
                <ProvenanceBadge provenance={a.overall_provenance} />
              </li>
            ))}
          </ul>
        </section>

        <VerdictMathPanel
          verdict={{
            verdict,
            overall_provenance: prov,
            agent_summaries: row.agent_summaries,
            weighting_breakdown: row.weighting_breakdown ?? undefined,
          }}
        />

        {chain.length > 0 && <ReasoningChain reasoningChain={chain} minoritySignals={minority} agentSummaries={row.agent_summaries} />}

        <section className="sealed-panel" aria-label="What this record holds">
          <h2 className="sealed-h2">What this record holds</h2>
          <p className="sealed-copy">
            The verdict, its figures, the five specialists&apos; votes and headlines, the reasoning chain and the minority signals,
            exactly as written to the append-only record at the time of the run.
            {row.weighting_breakdown ? " The verdict math is the stored math from that run." : " The verdict math shown is rebuilt from the stored votes with the same arithmetic; the structural nudge of the original run is not stored for this record."}
            {" "}The per-figure evidence ledger and the coverage map are not stored with a record, so they are not shown here; a signed-in
            owner sees them on a fresh run.
          </p>
        </section>
      </main>

      <footer className="sealed-foot">© 2026 KOANO Inc. All rights reserved.</footer>

      <style>{`
        .sealed { min-height: 100vh; background: var(--pale-wash); display: flex; flex-direction: column; }
        .sealed-head { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-3) var(--space-5); min-height: var(--nav-h); background: var(--white); border-bottom: 1px solid var(--border-light); }
        .sealed-tag { font-family: var(--font-mono); font-size: var(--text-micro); letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-muted); }
        .sealed-main { width: 100%; max-width: var(--content-reading); margin: 0 auto; padding: var(--space-6) var(--space-4) var(--space-8); display: flex; flex-direction: column; gap: var(--space-5); }
        .sealed-panel { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius-card); padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4); }
        .sealed-h2 { font-size: var(--text-ui); font-weight: 500; color: var(--ink-primary); margin: 0; }
        .sealed-copy { font-size: var(--text-body); line-height: 1.6; color: var(--ink-secondary); margin: 0; }
        .sealed-agents { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
        .sealed-agent { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--space-1) var(--space-3); padding: var(--space-3) 0; border-top: 1px solid var(--border-light); align-items: start; }
        .sealed-agent-name { font-size: var(--text-body); font-weight: 500; color: var(--ink-primary); }
        .sealed-agent-vote { font-family: var(--font-mono); font-size: var(--text-caption); letter-spacing: 0.06em; grid-column: 2; grid-row: 1; white-space: nowrap; }
        .sealed-agent-head { font-size: var(--text-data); line-height: 1.5; color: var(--ink-secondary); grid-column: 1 / -1; }
        .sealed-foot { padding: var(--space-5); text-align: center; font-size: var(--text-caption); color: var(--ink-muted); }
      `}</style>
    </div>
  );
}
