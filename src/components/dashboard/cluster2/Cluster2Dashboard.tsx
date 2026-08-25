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
import VerdictMathPanel from "@/components/ui/VerdictMathPanel";
import LocationConfidenceNote from "@/components/ui/LocationConfidenceNote";
import CandidatePicker from "@/components/ui/CandidatePicker";
import RunDegradationNote from "@/components/ui/RunDegradationNote";
import ProvenanceLedger from "@/components/ui/ProvenanceLedger";
import ReasoningChain from "@/components/ui/ReasoningChain";
import type { AddressCandidate } from "@/components/ui/verdict";
import { CLUSTERS } from "../clusters";
import { useVerdictStream } from "../useVerdictStream";
import { useAddressResolver, type RunPayload } from "../useAddressResolver";
import VerdictHistory from "../VerdictHistory";
import MarketVelocityPanel from "./MarketVelocityPanel";
import PropertyMap from "../cluster1/PropertyMap";
import CmaBuilder from "./CmaBuilder";
import CompsScatter from "./CompsScatter";
import PricingPanel from "./PricingPanel";
import PermitTrend from "./PermitTrend";
import NarrativePanel from "./NarrativePanel";
import DocumentButton from "../DocumentButton";
import type { SiteDetailResponse } from "@/app/api/site-detail/route";

const MARKET_BLOCKS = [
  "zoning",
  "permits",
  "hpi",
  "demographics",
  "mortgage_demand",
  "mls_comps",
  "employment",
  "proforma",
];

export default function Cluster2Dashboard() {
  const c = CLUSTERS.cluster_2;
  const stream = useVerdictStream();
  const [detail, setDetail] = useState<SiteDetailResponse | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [activePayload, setActivePayload] = useState<RunPayload | null>(null);

  async function fetchDetail(payload: RunPayload) {
    setDetail(null);
    setDetailError(null);
    try {
      const res = await fetch("/api/site-detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, blocks: MARKET_BLOCKS }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
      setDetail(json as SiteDetailResponse);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "market detail failed");
    }
  }

  // Fires only AFTER resolution succeeds (a confident match, or the user's pick).
  function startRun(payload: RunPayload) {
    setStarted(true);
    setActivePayload(payload);
    void stream.run(payload);
    void fetchDetail(payload);
  }

  const resolver = useAddressResolver(startRun);

  // A new submission hides any prior panels until this address resolves, so a
  // resolution problem never leaves stale results (or five panel errors) on screen.
  function analyze(address: string) {
    setStarted(false);
    setActivePayload(null);
    setDetail(null);
    setDetailError(null);
    stream.reset();
    void resolver.resolve(address);
  }

  const { status, result } = stream;
  const activeCandidate: AddressCandidate | null =
    activePayload && "candidate" in activePayload ? activePayload.candidate : null;
  const subjectAddress =
    result?.resolved_address.normalized ??
    detail?.resolved_address.normalized ??
    activeCandidate?.label ??
    null;
  const resolving = resolver.state.phase === "resolving";

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

      <AddressInput onSubmit={analyze} busy={resolving || status === "running"} />

      <LocationConfidenceNote confidence={detail?.resolved_address?.location_confidence} />

      {/* Resolution step — a single banner, never five panel errors. */}
      {resolving && (
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>Resolving address…</p>
      )}
      {resolver.state.phase === "ambiguous" && (
        <CandidatePicker candidates={resolver.state.candidates} onChoose={resolver.choose} />
      )}
      {resolver.state.phase === "none" && (
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
            {resolver.state.error}
          </p>
          <p style={{ fontSize: "12px", color: "var(--ink-faint)", margin: "6px 0 0" }}>
            Live NYC data is deepest. Try a New York City street address.
          </p>
        </div>
      )}

      {!started && resolver.state.phase === "idle" && (
        /* Empty state — approved copy (KOANO_COPY.md) */
        <div style={{ maxWidth: "620px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 500, color: "var(--ink-primary)", margin: "0 0 8px" }}>
            Start with an address or a neighborhood.
          </h3>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--ink-muted)", margin: 0 }}>
            You will get the market picture first, within a few seconds. The
            verdict and the reasoning arrive when the agents finish, which
            takes about a minute and a half.
          </p>
        </div>
      )}

      {started && (
        <>
          {/* Market data sections — render as soon as the fast fetch lands */}
          <MarketVelocityPanel detail={detail} detailError={detailError} id="c2-velocity" />
          <PropertyMap detail={detail} detailError={detailError} title="Comparable sales" id="c2-map" />
          <CmaBuilder detail={detail} detailError={detailError} id="c2-cma" />
          <CompsScatter detail={detail} id="c2-scatter" />
          <PricingPanel
            detail={detail}
            detailError={detailError}
            verdict={result?.verdict ?? null}
            id="c2-pricing"
          />
          <PermitTrend detail={detail} id="c2-permits" />
          <NarrativePanel address={subjectAddress} candidate={activeCandidate} id="c2-narrative" />

          {/* Downloadable documents — grouped, matching the Cluster 1 & 5 pattern */}
          {subjectAddress && (
            <div id="c2-documents" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                  Client-ready PDFs for {subjectAddress}, on your letterhead. Every figure carries its
                  source; the disclaimer footer is on every page.
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
                  docType="client_neighborhood_report"
                  title="Client Neighborhood Report"
                  address={subjectAddress}
                  formats={["pdf"]}
                  id="c2-neighborhood-doc"
                />
                <DocumentButton
                  docType="pricing_recommendation_sheet"
                  title="Pricing Recommendation Sheet"
                  address={subjectAddress}
                  formats={["pdf"]}
                  singleAction={true}
                  id="c2-pricing-doc"
                />
                <DocumentButton
                  docType="buyer_seller_net_sheet"
                  title="Buyer / Seller Net Sheet"
                  address={subjectAddress}
                  formats={["pdf"]}
                  singleAction={true}
                  id="c2-netsheet-doc"
                />
                {/* CMA is a feature gap (listing photos + geocoded comps), not a
                    data gap — surfaced as a disabled tile, not a broken button. */}
                <div
                  style={{
                    border: "1px dashed var(--border)",
                    borderRadius: "16px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <h3 style={{ fontSize: "16px", fontWeight: 500, color: "var(--ink-muted)", margin: 0 }}>
                    Comparative Market Analysis
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--ink-faint)", margin: 0 }}>
                    Not yet available — the CMA needs listing photos and geocoded comps, which KOANO
                    does not source today.
                  </p>
                </div>
              </div>
            </div>
          )}

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
                Live NYC data is deepest. Try a New York City street address.
              </p>
            </div>
          )}
          {status === "done" && result && (
            <>
              <VerdictCard verdict={result.verdict} address={result.resolved_address.normalized} />
              <RunDegradationNote degradation={result.degradation} />
              <VerdictMathPanel verdict={result.verdict} />
              <ReasoningChain
                reasoningChain={result.verdict.reasoning_chain}
                minoritySignals={result.verdict.minority_signals}
                agentSummaries={result.verdict.agent_summaries}
              />
              <ProvenanceLedger
                dataPoints={result.verdict.data_points}
                locationConfidence={result.resolved_address.location_confidence}
                address={result.resolved_address.normalized}
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
