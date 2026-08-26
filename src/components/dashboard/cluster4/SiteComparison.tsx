"use client";

// SiteComparison — Cluster 4 default view (Checkpoint 3).
// Up to three NYC site addresses; all five agents run on each in parallel;
// synthesis ranks the sites by risk-adjusted opportunity. Ranking is
// deterministic code over the real verdicts (verdict favorability, then
// confidence net of risk) — the components of the ranking are always shown.

import React, { useState } from "react";
import LoadingState from "@/components/ui/LoadingState";
import VerdictCard from "@/components/ui/VerdictCard";
import VerdictMathPanel from "@/components/ui/VerdictMathPanel";
import ReasoningChain from "@/components/ui/ReasoningChain";
import ProvenanceLedger from "@/components/ui/ProvenanceLedger";
import CoverageMap from "@/components/ui/CoverageMap";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import CandidatePicker from "@/components/ui/CandidatePicker";
import { VERDICT_COLORS, type SynthesisResult, type Verdict, type AddressCandidate } from "@/components/ui/verdict";
import { useVerdictStream, type VerdictStream, type RunDegradation } from "../useVerdictStream";
import type { RunPayload } from "../useAddressResolver";
import RunDegradationNote from "@/components/ui/RunDegradationNote";
import SitePanels from "./SitePanels";
import MultiSiteMap, { type MultiSite } from "./MultiSiteMap";
import SiteMathStrip, { type StripSite } from "./SiteMathStrip";
import MonitoringFeed from "../cluster5/MonitoringFeed";
import DocumentButton from "../DocumentButton";
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

  // Disambiguation is per-slot, but presented ONE picker at a time so three
  // ambiguous addresses never become three simultaneous prompts. Slots that
  // resolve confidently start analyzing immediately; ambiguous ones queue.
  const [resolvingSlots, setResolvingSlots] = useState<number[]>([]);
  const [pendingQueue, setPendingQueue] = useState<{ slot: number; candidates: AddressCandidate[] }[]>([]);
  const [resolveErrors, setResolveErrors] = useState<Record<number, string>>({});

  const streamA = useVerdictStream();
  const streamB = useVerdictStream();
  const streamC = useVerdictStream();
  const streams: VerdictStream[] = [streamA, streamB, streamC];

  const resolving = resolvingSlots.length > 0;
  const hasPending = pendingQueue.length > 0;
  const running =
    resolving || hasPending || activeSlots.some((i) => streams[i].status === "running");
  const finished =
    !resolving &&
    !hasPending &&
    activeSlots.length > 0 &&
    activeSlots.every((i) => streams[i].status === "done" || streams[i].status === "error");

  async function fetchDetail(slot: number, payload: RunPayload) {
    setDetails((prev) => prev.map((d, i) => (i === slot ? { loading: true, data: null, error: null } : d)));
    try {
      const res = await fetch("/api/site-detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Blocks the comparison + map need: entitlement inputs, OZ, and the
        // geometry for tract shading + lot footprint.
        body: JSON.stringify({ ...payload, blocks: ["zoning", "opportunity_zone", "permits", "proforma", "geometry"] }),
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

  // A slot begins analysis only AFTER it resolves (confident, or the user's pick).
  function startSlot(slot: number, payload: RunPayload) {
    setActiveSlots((prev) => (prev.includes(slot) ? prev : [...prev, slot].sort((a, b) => a - b)));
    void streams[slot].run(payload);
    void fetchDetail(slot, payload);
  }

  function choosePending(slot: number, candidate: AddressCandidate) {
    setPendingQueue((prev) => prev.filter((p) => p.slot !== slot));
    startSlot(slot, { candidate });
  }

  async function runComparison(e: React.FormEvent) {
    e.preventDefault();
    if (running) return;
    const slots = addresses
      .map((a, i) => ({ address: a.trim(), i }))
      .filter((s) => s.address.length > 0);
    if (slots.length === 0) return;

    // Fresh run — clear prior state on every slot.
    streams.forEach((s) => s.reset());
    setActiveSlots([]);
    setDetails([idleDetail, idleDetail, idleDetail]);
    setPendingQueue([]);
    setResolveErrors({});
    setResolvingSlots(slots.map((s) => s.i));

    // Resolve all slots concurrently. Confident → start now; ambiguous → queue
    // (surfaced one at a time); none → a per-slot resolve error.
    slots.forEach(async ({ address, i }) => {
      try {
        const res = await fetch("/api/resolve-address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });
        const json = await res.json().catch(() => null);
        setResolvingSlots((prev) => prev.filter((x) => x !== i));
        if (res.ok && json?.status === "ambiguous" && Array.isArray(json.candidates) && json.candidates.length > 0) {
          setPendingQueue((prev) => [...prev, { slot: i, candidates: json.candidates as AddressCandidate[] }]);
        } else if (res.ok && json?.status === "resolved") {
          startSlot(i, { address });
        } else {
          setResolveErrors((prev) => ({ ...prev, [i]: json?.error || `Could not resolve ${SLOT_LABELS[i]}` }));
        }
      } catch (err) {
        setResolvingSlots((prev) => prev.filter((x) => x !== i));
        setResolveErrors((prev) => ({ ...prev, [i]: err instanceof Error ? err.message : "resolve failed" }));
      }
    });
  }

  // Ranked results (only sites whose pipeline completed).
  const ranked = activeSlots
    .filter((i) => streams[i].status === "done" && streams[i].result)
    .sort((a, b) => opportunityScore(streams[b].result!.verdict) - opportunityScore(streams[a].result!.verdict));
  const errored = activeSlots.filter((i) => streams[i].status === "error");
  const rankedSites: MultiSite[] = ranked.map((slot, rank) => ({
    label: SLOT_LABELS[slot],
    detail: details[slot].data,
    verdict: streams[slot].result?.verdict.verdict ?? null,
    rank: rank + 1,
  }));
  // Label the strip with the SAME identifier the table uses (the address, short
  // form) — not "Site A/B/C" — so the two read as the same ranking. Both derive
  // from `ranked`, so the order already agrees; this makes it visibly agree.
  const stripSites: StripSite[] = ranked.map((slot, rank) => ({
    label: (streams[slot].result!.resolved_address.normalized || SLOT_LABELS[slot]).split(",")[0].trim(),
    rank: rank + 1,
    verdict: streams[slot].result!.verdict,
  }));
  const resolveErrorSlots = Object.keys(resolveErrors).map(Number);
  const anyActivity =
    resolving || hasPending || activeSlots.length > 0 || resolveErrorSlots.length > 0;

  // Aggregate throttle/timeout degradation across the three site runs.
  const degradedSlots = activeSlots.filter((i) => streams[i].result?.degradation?.degraded);
  const runDegradation: RunDegradation | undefined = degradedSlots.length
    ? {
        degraded: true,
        timeouts: degradedSlots.reduce((s, i) => s + (streams[i].result!.degradation!.timeouts || 0), 0),
        throttled: degradedSlots.reduce((s, i) => s + (streams[i].result!.degradation!.throttled || 0), 0),
        hosts: Array.from(new Set(degradedSlots.flatMap((i) => streams[i].result!.degradation!.hosts))),
      }
    : undefined;

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

      {/* Disambiguation — one picker at a time, so three ambiguous addresses
          never stack into three prompts. Confident slots are already running. */}
      {resolving && (
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
          Resolving {resolvingSlots.length === 1 ? "1 address" : `${resolvingSlots.length} addresses`}…
        </p>
      )}
      {hasPending && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={monoLabel}>
            {SLOT_LABELS[pendingQueue[0].slot]}: which building?
            {pendingQueue.length > 1 && ` (${pendingQueue.length - 1} more to confirm)`}
          </span>
          <CandidatePicker
            candidates={pendingQueue[0].candidates}
            onChoose={(cand) => choosePending(pendingQueue[0].slot, cand)}
          />
        </div>
      )}
      {resolveErrorSlots.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {resolveErrorSlots.map((i) => (
            <div
              key={i}
              style={{
                border: "1px solid var(--border)",
                borderLeft: "3px solid var(--signal-negative)",
                borderRadius: "0 12px 12px 0",
                padding: "12px 16px",
                maxWidth: "620px",
              }}
            >
              <p style={{ fontSize: "13px", color: "var(--ink-secondary)", margin: 0 }}>
                <strong style={{ fontWeight: 500 }}>{SLOT_LABELS[i]}:</strong> {resolveErrors[i]}
              </p>
            </div>
          ))}
        </div>
      )}

      {!anyActivity && (
        /* Empty state — approved copy (KOANO_COPY.md) */
        <div style={{ maxWidth: "620px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 500, color: "var(--ink-primary)", margin: "0 0 8px" }}>
            Enter up to three sites.
          </h3>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--ink-muted)", margin: 0 }}>
            Each one gets the full engine: zoning, permits, entitlement risk,
            and public investment in the catchment. KOANO ranks them by
            risk-adjusted opportunity and shows you exactly how it got there.
            Three sites take about two minutes.
          </p>
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
                  Complete. Waiting for the other sites
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
              Ranked by verdict favorability, then confidence net of risk. Computed from the
              verdicts below, every input auditable.
            </p>
          </div>

          <RunDegradationNote degradation={runDegradation} />

          {/* The three sites in space — Opportunity-Zone tract shading + subject lots, all live. */}
          <MultiSiteMap sites={rankedSites} />

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

          {/* Small-multiples: the three sites' verdict math side by side. */}
          <SiteMathStrip sites={stripSites} />

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
                <VerdictMathPanel verdict={r.verdict} />
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
                <CoverageMap dataPoints={r.verdict.data_points} />

                <ProvenanceLedger
                  dataPoints={r.verdict.data_points}
                  locationConfidence={r.resolved_address.location_confidence}
                  address={r.resolved_address.normalized}
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "16px",
                  }}
                >
                  <DocumentButton
                    docType="site_screening_memo"
                    title="Development Site Screening Memo"
                    address={r.resolved_address.normalized}
                    hasRecentVerdict={true}
                    id={`c4-screening-${slot}`}
                  />
                  <DocumentButton
                    docType="entitlement_risk_memo"
                    title="Entitlement Risk Memo"
                    address={r.resolved_address.normalized}
                    hasRecentVerdict={true}
                    id={`c4-entitlement-${slot}`}
                  />
                </div>
              </div>
            );
          })}

          {/* One comparison brief across the ranked sites */}
          {ranked.length >= 2 && (
            <DocumentButton
              docType="three_site_comparison_brief"
              title="Three-Site Comparison Brief"
              addresses={ranked.map((slot) => streams[slot].result!.resolved_address.normalized)}
              hasRecentVerdict={true}
              id="c4-comparison-brief"
            />
          )}
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
            Live NYC data is deepest. Try New York City street addresses.
          </p>
        </div>
      )}

      {/* Monitoring feed — the developer's watched sites, portfolio-wide (Phase 2). */}
      <MonitoringFeed id="c4-monitoring" />
    </div>
  );
}
