"use client";

// SiteComparison — Cluster 4 default view (Checkpoint 3).
// Up to three NYC site addresses; all five agents run on each in parallel;
// synthesis ranks the sites by risk-adjusted opportunity. Ranking is
// deterministic code over the real verdicts (verdict favorability, then
// confidence net of risk) — the components of the ranking are always shown.

import React, { useState } from "react";
import LoadingState from "@/components/ui/LoadingState";
import VerdictCard from "@/components/ui/VerdictCard";
import ReasoningChain from "@/components/ui/ReasoningChain";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import { VERDICT_COLORS, type SynthesisResult, type Verdict } from "@/components/ui/verdict";
import { useVerdictStream, type VerdictStream } from "../useVerdictStream";
import SitePanels from "./SitePanels";
import type { SiteDetailResponse } from "@/app/api/site-detail/route";

const SLOT_LABELS = ["Site A", "Site B", "Site C"];

// Verdict favorability dominates; confidence net of risk breaks ties.
const VERDICT_WEIGHT: Record<Verdict, number> = {
  buy: 2,
  hold: 1,
  wait: 0.5,
  sell: 0,
  drop: 0,
};

function opportunityScore(v: SynthesisResult): number {
  return VERDICT_WEIGHT[v.verdict] * 100 + v.confidence - v.risk_score;
}

interface DetailState {
  loading: boolean;
  data: SiteDetailResponse | null;
  error: string | null;
}

const idleDetail: DetailState = { loading: false, data: null, error: null };

const monoLabel: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: "10px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--ink-faint)",
};

export default function SiteComparison() {
  const [addresses, setAddresses] = useState<string[]>(["", "", ""]);
  const [activeSlots, setActiveSlots] = useState<number[]>([]);
  const [details, setDetails] = useState<DetailState[]>([idleDetail, idleDetail, idleDetail]);

  const streamA = useVerdictStream();
  const streamB = useVerdictStream();
  const streamC = useVerdictStream();
  const streams: VerdictStream[] = [streamA, streamB, streamC];

  const running = activeSlots.some((i) => streams[i].status === "running");
  const finished =
    activeSlots.length > 0 &&
    activeSlots.every((i) => streams[i].status === "done" || streams[i].status === "error");

  async function fetchDetail(slot: number, address: string) {
    setDetails((prev) => prev.map((d, i) => (i === slot ? { loading: true, data: null, error: null } : d)));
    try {
      const res = await fetch("/api/site-detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
      setDetails((prev) =>
        prev.map((d, i) => (i === slot ? { loading: false, data: json as SiteDetailResponse, error: null } : d)),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "site detail failed";
      setDetails((prev) =>
        prev.map((d, i) => (i === slot ? { loading: false, data: null, error: msg } : d)),
      );
    }
  }

  function runComparison(e: React.FormEvent) {
    e.preventDefault();
    if (running) return;
    const slots = addresses
      .map((a, i) => ({ address: a.trim(), i }))
      .filter((s) => s.address.length > 0);
    if (slots.length === 0) return;
    setActiveSlots(slots.map((s) => s.i));
    for (const s of slots) {
      void streams[s.i].run(s.address);
      void fetchDetail(s.i, s.address);
    }
  }

  // Ranked results (only sites whose pipeline completed).
  const ranked = activeSlots
    .filter((i) => streams[i].status === "done" && streams[i].result)
    .sort((a, b) => opportunityScore(streams[b].result!.verdict) - opportunityScore(streams[a].result!.verdict));
  const errored = activeSlots.filter((i) => streams[i].status === "error");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Address slots */}
      <form
        onSubmit={runComparison}
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "12px",
          }}
        >
          {SLOT_LABELS.map((label, i) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor={`site-${i}`} style={monoLabel}>
                {label}
              </label>
              <input
                id={`site-${i}`}
                type="text"
                value={addresses[i]}
                onChange={(e) =>
                  setAddresses((prev) => prev.map((a, j) => (j === i ? e.target.value : a)))
                }
                placeholder={i === 0 ? "175 3rd Street, Brooklyn, NY" : "Optional"}
                disabled={running}
                style={{
                  padding: "12px 16px",
                  borderRadius: "100px",
                  border: "1px solid var(--border)",
                  background: "var(--white)",
                  fontFamily: "inherit",
                  fontSize: "14px",
                  color: "var(--ink-primary)",
                  outline: "none",
                }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={running || addresses.every((a) => !a.trim())}
            style={{
              opacity: running || addresses.every((a) => !a.trim()) ? 0.55 : 1,
              cursor: running ? "wait" : "pointer",
            }}
          >
            {running ? "Comparing sites…" : "Run comparison"}
            {!running && <span aria-hidden="true">↗</span>}
          </button>
          <span style={{ fontSize: "12px", color: "var(--ink-faint)" }}>
            Up to three sites · all five agents run on each · ~1–3 min
          </span>
        </div>
      </form>

      {activeSlots.length === 0 && (
        /* [COPY TBD] dashboard empty state — designated placeholder, Section 13 */
        <div className="copy-placeholder" style={{ maxWidth: "620px" }}>
          [COPY TBD — dashboard empty state]
        </div>
      )}

      {/* Per-site progress while running */}
      {activeSlots.length > 0 && !finished && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fit, minmax(300px, 1fr))`,
            gap: "16px",
          }}
        >
          {activeSlots.map((i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={monoLabel}>{SLOT_LABELS[i]}</span>
              {streams[i].status === "running" ? (
                <LoadingState
                  phase={streams[i].phase}
                  agents={streams[i].agents}
                  startedAt={streams[i].startedAt}
                  normalizedAddress={streams[i].normalized}
                />
              ) : streams[i].status === "error" ? (
                <p style={{ fontSize: "13px", color: "var(--signal-negative)", margin: 0 }}>
                  Failed: {streams[i].error}
                </p>
              ) : (
                <p style={{ fontSize: "13px", color: "var(--signal-positive)", margin: 0 }}>
                  Complete — waiting for the other sites
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ranked comparison */}
      {finished && ranked.length > 0 && (
        <>
          <div>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--ink-primary)",
                margin: "0 0 4px",
              }}
            >
              Risk-adjusted opportunity ranking
            </h2>
            <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
              Ranked by verdict favorability, then confidence net of risk — computed from the
              verdicts below, every input auditable.
            </p>
          </div>

          {/* Summary table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "560px" }}>
              <thead>
                <tr>
                  {["Rank", "Site", "Verdict", "Confidence", "Risk", "Entitlement risk", "Window", "Provenance"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          ...monoLabel,
                          textAlign: "left",
                          padding: "10px 14px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {ranked.map((slot, rank) => {
                  const r = streams[slot].result!;
                  const v = r.verdict;
                  const reg = v.agent_summaries.find((s) => s.agent === "regulatory-policy");
                  return (
                    <tr key={slot}>
                      <td style={{ padding: "12px 14px", fontFamily: "'DM Mono', monospace", fontSize: "14px", color: "var(--ink-primary)", borderBottom: "1px solid var(--border-light)" }}>
                        #{rank + 1}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: "13px", color: "var(--ink-secondary)", borderBottom: "1px solid var(--border-light)" }}>
                        {r.resolved_address.normalized}
                      </td>
                      <td style={{ padding: "12px 14px", fontFamily: "'DM Mono', monospace", fontSize: "13px", textTransform: "uppercase", fontWeight: 500, color: VERDICT_COLORS[v.verdict], borderBottom: "1px solid var(--border-light)" }}>
                        {v.verdict}
                      </td>
                      <td style={{ padding: "12px 14px", fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "var(--ink-primary)", borderBottom: "1px solid var(--border-light)" }}>
                        {v.confidence}
                      </td>
                      <td style={{ padding: "12px 14px", fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "var(--ink-primary)", borderBottom: "1px solid var(--border-light)" }}>
                        {v.risk_score}
                      </td>
                      <td style={{ padding: "12px 14px", fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "var(--ink-primary)", borderBottom: "1px solid var(--border-light)" }}>
                        {reg ? `${reg.risk_score}/100` : "—"}
                      </td>
                      <td style={{ padding: "12px 14px", fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "var(--ink-primary)", borderBottom: "1px solid var(--border-light)" }}>
                        {v.signal_window_months} mo
                      </td>
                      <td style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-light)" }}>
                        <ProvenanceBadge provenance={v.overall_provenance} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Per-site detail */}
          {ranked.map((slot, rank) => {
            const r = streams[slot].result!;
            return (
              <div key={slot} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginTop: "8px" }}>
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--brand-blue)",
                      letterSpacing: "1.5px",
                    }}
                  >
                    #{rank + 1}
                  </span>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: 500,
                      color: "var(--ink-primary)",
                      margin: 0,
                    }}
                  >
                    {r.resolved_address.normalized}
                  </h3>
                  {r.resolved_address.bbl && (
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--ink-faint)" }}>
                      BBL {r.resolved_address.bbl}
                    </span>
                  )}
                </div>
                <VerdictCard verdict={r.verdict} />
                <SitePanels
                  detail={details[slot].data}
                  detailError={details[slot].error}
                  verdict={r.verdict}
                />
                <ReasoningChain
                  reasoningChain={r.verdict.reasoning_chain}
                  minoritySignals={r.verdict.minority_signals}
                  agentSummaries={r.verdict.agent_summaries}
                />
              </div>
            );
          })}
        </>
      )}

      {/* Failed sites, reported plainly */}
      {finished && errored.length > 0 && (
        <div
          style={{
            border: "1px solid var(--border)",
            borderLeft: "3px solid var(--signal-negative)",
            borderRadius: "0 12px 12px 0",
            padding: "16px 20px",
            maxWidth: "620px",
          }}
        >
          {errored.map((i) => (
            <p key={i} style={{ fontSize: "14px", color: "var(--ink-secondary)", margin: 0 }}>
              {SLOT_LABELS[i]} ({addresses[i]}): {streams[i].error}
            </p>
          ))}
          <p style={{ fontSize: "12px", color: "var(--ink-faint)", margin: "6px 0 0" }}>
            Live NYC data is deepest — try New York City street addresses.
          </p>
        </div>
      )}
    </div>
  );
}
