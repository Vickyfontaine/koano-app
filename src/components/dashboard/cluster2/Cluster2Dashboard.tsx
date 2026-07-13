"use client";

// Cluster 2 — Transaction Intelligence dashboard (Checkpoint 4).
// Default view: market velocity (Section 08). CMA builder with early-signal
// overlay, client-ready narrative, pricing recommendation with reasoning.
// Data-driven sections render as soon as the fast provider fetch lands; the
// five-agent verdict fills in when the pipeline completes. MLS comps are
// representative and labeled everywhere — live MLS access is never implied.

import React, { useState } from "react";
import AddressInput from "@/components/ui/AddressInput";
import LoadingState from "@/components/ui/LoadingState";
import VerdictCard from "@/components/ui/VerdictCard";
import ReasoningChain from "@/components/ui/ReasoningChain";
import { CLUSTERS } from "../clusters";
import { useVerdictStream } from "../useVerdictStream";
import VerdictHistory from "../VerdictHistory";
import MarketVelocityPanel from "./MarketVelocityPanel";
import CmaBuilder from "./CmaBuilder";
import PricingPanel from "./PricingPanel";
import NarrativePanel from "./NarrativePanel";
import type { SiteDetailResponse } from "@/app/api/site-detail/route";

const MARKET_BLOCKS = [
  "zoning",
  "permits",
  "hpi",
  "demographics",
  "search_trends",
  "mls_comps",
  "foot_traffic",
  "proforma",
];

export default function Cluster2Dashboard() {
  const c = CLUSTERS.cluster_2;
  const stream = useVerdictStream();
  const [detail, setDetail] = useState<SiteDetailResponse | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  async function fetchDetail(address: string) {
    setDetail(null);
    setDetailError(null);
    try {
      const res = await fetch("/api/site-detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, blocks: MARKET_BLOCKS }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
      setDetail(json as SiteDetailResponse);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "market detail failed");
    }
  }

  function analyze(address: string) {
    setStarted(true);
    void stream.run(address);
    void fetchDetail(address);
  }

  const { status, result } = stream;
  const subjectAddress = result?.resolved_address.normalized ?? detail?.resolved_address.normalized ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1080px" }}>
      <div>
        <span className="section-number">{c.number}</span>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--ink-primary)",
            margin: "12px 0 8px",
          }}
        >
          {c.label}
        </h1>
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--ink-faint)",
            margin: 0,
          }}
        >
          {c.audience}
        </p>
      </div>

      <AddressInput onSubmit={analyze} busy={status === "running"} />

      {!started && (
        /* [COPY TBD] dashboard empty state — designated placeholder, Section 13 */
        <div className="copy-placeholder" style={{ maxWidth: "620px" }}>
          [COPY TBD — dashboard empty state]
        </div>
      )}

      {started && (
        <>
          {/* Market data sections — render as soon as the fast fetch lands */}
          <MarketVelocityPanel detail={detail} detailError={detailError} id="c2-velocity" />
          <CmaBuilder detail={detail} detailError={detailError} id="c2-cma" />
          <PricingPanel
            detail={detail}
            detailError={detailError}
            verdict={result?.verdict ?? null}
            id="c2-pricing"
          />
          <NarrativePanel address={subjectAddress} id="c2-narrative" />

          {/* Verdict pipeline */}
          {status === "running" && (
            <LoadingState
              phase={stream.phase}
              agents={stream.agents}
              startedAt={stream.startedAt}
              normalizedAddress={stream.normalized}
            />
          )}
          {status === "error" && (
            <div
              style={{
                border: "1px solid var(--border)",
                borderLeft: "3px solid var(--signal-negative)",
                borderRadius: "0 12px 12px 0",
                padding: "16px 20px",
                maxWidth: "620px",
              }}
            >
              <p style={{ fontSize: "14px", color: "var(--ink-secondary)", margin: 0 }}>
                Verdict pipeline failed: {stream.error}
              </p>
              <p style={{ fontSize: "12px", color: "var(--ink-faint)", margin: "6px 0 0" }}>
                Live NYC data is deepest — try a New York City street address.
              </p>
            </div>
          )}
          {status === "done" && result && (
            <>
              <VerdictCard verdict={result.verdict} address={result.resolved_address.normalized} />
              <ReasoningChain
                reasoningChain={result.verdict.reasoning_chain}
                minoritySignals={result.verdict.minority_signals}
                agentSummaries={result.verdict.agent_summaries}
              />
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "11px",
                  color: "var(--ink-faint)",
                  margin: 0,
                }}
              >
                {result.persisted
                  ? "Recorded to your verdict history (append-only audit trail)"
                  : `Not recorded: ${result.persist_error ?? "persistence unavailable"}`}
              </p>
            </>
          )}
        </>
      )}

      <VerdictHistory id="c2-history" />
    </div>
  );
}
