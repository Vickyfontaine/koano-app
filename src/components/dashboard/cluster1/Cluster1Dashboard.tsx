"use client";

// Cluster 1 — Property Intelligence dashboard (Checkpoint 4).
// Default view: single property (Section 08). Honest AVM assembled from
// badged parts, permit history (live NYC DOB), the KOANO verdict with full
// reasoning, and alerts derived from real fetched data. No neural map.

import React, { useState } from "react";
import AddressInput from "@/components/ui/AddressInput";
import LoadingState from "@/components/ui/LoadingState";
import VerdictCard from "@/components/ui/VerdictCard";
import VerdictMathPanel from "@/components/ui/VerdictMathPanel";
import LocationConfidenceNote from "@/components/ui/LocationConfidenceNote";
import ReasoningChain from "@/components/ui/ReasoningChain";
import { CLUSTERS } from "../clusters";
import { useVerdictStream } from "../useVerdictStream";
import VerdictHistory from "../VerdictHistory";
import PermitHistoryPanel from "../PermitHistoryPanel";
import DocumentButton from "../DocumentButton";
import PropertyMap from "./PropertyMap";
import ValuationPanel from "./ValuationPanel";
import AlertsPanel from "./AlertsPanel";
import ViolationsPanel from "./ViolationsPanel";
import OwnershipPanel from "./OwnershipPanel";
import type { SiteDetailResponse } from "@/app/api/site-detail/route";

const PROPERTY_BLOCKS = [
  "zoning",
  "permits",
  "opportunity_zone",
  "flood",
  "flood_zones",
  "demographics",
  "hpi",
  "mls_comps",
  "contamination",
  "building_violations",
  "landlord_portfolio",
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

      <LocationConfidenceNote confidence={detail?.resolved_address?.location_confidence} />

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

      {/* The map leads the property view — it orients instantly (and the
          flood-edge relationship is itself a finding), while the verdict
          pipeline runs below. Renders as soon as the fast block data lands. */}
      {status !== "idle" && (
        <PropertyMap detail={detail} detailError={detailError} id="c1-map" />
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
            Live NYC data is deepest. Try a New York City street address.
          </p>
        </div>
      )}

      {status === "done" && result && (
        <>
          <VerdictCard verdict={result.verdict} address={result.resolved_address.normalized} />

          <VerdictMathPanel verdict={result.verdict} />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "16px",
            }}
          >
            <ValuationPanel detail={detail} detailError={detailError} id="c1-valuation" />
            <PermitHistoryPanel permits={detail?.permits} error={detailError} id="c1-permits" />
            <ViolationsPanel
              violations={detail?.building_violations}
              error={detailError}
              id="c1-violations"
            />
            <OwnershipPanel
              portfolio={detail?.landlord_portfolio}
              error={detailError}
              id="c1-ownership"
            />
          </div>

          <AlertsPanel detail={detail} detailError={detailError} id="c1-alerts" />

          {/* Downloadable documents — the Community document set, all built
              from the analyzed address on live NYC public data. */}
          <div id="c1-documents" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <span className="section-number">{c.number}.D</span>
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--ink-primary)",
                  margin: "8px 0 2px",
                }}
              >
                Downloadable documents
              </h2>
              <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
                Provenance-labeled PDFs for{" "}
                {result.resolved_address.normalized || result.resolved_address.input}. Every figure
                carries its source; the disclaimer footer is on every page.
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "16px",
              }}
            >
              <DocumentButton
                docType="property_intelligence_report"
                title="Property Intelligence Report"
                address={result.resolved_address.normalized || result.resolved_address.input}
                formats={["pdf"]}
                hasRecentVerdict={true}
                id="c1-property-intel-doc"
              />
              <DocumentButton
                docType="violation_ownership_record"
                title="Violation & Ownership Record"
                address={result.resolved_address.normalized || result.resolved_address.input}
                formats={["pdf"]}
                singleAction={true}
                id="c1-violation-record-doc"
              />
              <DocumentButton
                docType="permit_history_report"
                title="Permit History Report"
                address={result.resolved_address.normalized || result.resolved_address.input}
                formats={["pdf"]}
                singleAction={true}
                id="c1-permit-history-doc"
              />
              <DocumentButton
                docType="tax_appeal_packet"
                title="Property Tax Appeal Evidence Packet"
                address={result.resolved_address.normalized || result.resolved_address.input}
                formats={["pdf"]}
                hasRecentVerdict={true}
                id="c1-tax-appeal-doc"
              />
            </div>
          </div>

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
