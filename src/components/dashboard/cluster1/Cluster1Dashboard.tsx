"use client";

// Cluster 1 — Property Intelligence dashboard (Checkpoint 4).
// Default view: single property (Section 08). Honest AVM assembled from
// badged parts, permit history (live NYC DOB), the KOANO verdict with full
// reasoning, and alerts derived from real fetched data. No neural map.

import React, { useState } from "react";
import AddressInput from "@/components/ui/AddressInput";
import LoadingState from "@/components/ui/LoadingState";
import VerdictCard from "@/components/ui/VerdictCard";
import ReasoningChain from "@/components/ui/ReasoningChain";
import { CLUSTERS } from "../clusters";
import { useVerdictStream } from "../useVerdictStream";
import VerdictHistory from "../VerdictHistory";
import PermitHistoryPanel from "../PermitHistoryPanel";
import ValuationPanel from "./ValuationPanel";
import AlertsPanel from "./AlertsPanel";
import type { SiteDetailResponse } from "@/app/api/site-detail/route";

const PROPERTY_BLOCKS = [
  "zoning",
  "permits",
  "opportunity_zone",
  "flood",
  "demographics",
  "hpi",
  "mls_comps",
];

export default function Cluster1Dashboard() {
  const c = CLUSTERS.cluster_1;
  const stream = useVerdictStream();
  const [detail, setDetail] = useState<SiteDetailResponse | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  async function fetchDetail(address: string) {
    setDetail(null);
    setDetailError(null);
    try {
      const res = await fetch("/api/site-detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, blocks: PROPERTY_BLOCKS }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
      setDetail(json as SiteDetailResponse);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "property detail failed");
    }
  }

  function analyze(address: string) {
    void stream.run(address);
    void fetchDetail(address);
  }

  const { status, result } = stream;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "980px" }}>
      <div id="c1-property">
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

      {status === "idle" && (
        /* Empty state — approved copy (KOANO_COPY.md) */
        <div style={{ maxWidth: "620px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 500, color: "var(--ink-primary)", margin: "0 0 8px" }}>
            Start with an address.
          </h3>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--ink-muted)", margin: 0 }}>
            KOANO will read the zoning, the permit history, and the flood and
            risk data around it, then tell you what it means for the property.
            It takes about a minute and a half, because the agents are actually
            working.
          </p>
        </div>
      )}

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
            Analysis failed: {stream.error}
          </p>
          <p style={{ fontSize: "12px", color: "var(--ink-faint)", margin: "6px 0 0" }}>
            Live NYC data is deepest — try a New York City street address.
          </p>
        </div>
      )}

      {status === "done" && result && (
        <>
          <VerdictCard verdict={result.verdict} address={result.resolved_address.normalized} />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "16px",
            }}
          >
            <ValuationPanel detail={detail} detailError={detailError} id="c1-valuation" />
            <PermitHistoryPanel permits={detail?.permits} error={detailError} id="c1-permits" />
          </div>

          <AlertsPanel detail={detail} detailError={detailError} id="c1-alerts" />

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

      <VerdictHistory id="c1-history" />
    </div>
  );
}
