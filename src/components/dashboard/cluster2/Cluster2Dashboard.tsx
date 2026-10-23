"use client";

// Cluster 2 — Transaction Intelligence dashboard (Checkpoint 4).
// Default view: market velocity (Section 08). CMA builder with early-signal
// overlay, client-ready narrative, pricing recommendation with reasoning.
// Data-driven sections render as soon as the fast provider fetch lands; the
// five-agent verdict fills in when the pipeline completes. MLS comps are
// representative and labeled everywhere — live MLS access is never implied.

import React, { useState } from "react";
import LocationConfidenceNote from "@/components/ui/LocationConfidenceNote";
import type { AddressCandidate } from "@/components/ui/verdict";
import { CLUSTERS } from "../clusters";
import { useVerdictStream } from "../useVerdictStream";
import type { RunPayload } from "../useAddressResolver";
import { useRegisterRun, usePendingSubject } from "../shell/SubjectProvider";
import VerdictHistory from "../VerdictHistory";
import MarketVelocityPanel from "./MarketVelocityPanel";
import PropertyMap from "../cluster1/PropertyMap";
import CmaBuilder from "./CmaBuilder";
import CompsScatter from "./CompsScatter";
import PricingPanel from "./PricingPanel";
import PermitTrend from "./PermitTrend";
import NarrativePanel from "./NarrativePanel";
import DocumentButton from "../DocumentButton";
import StickyAction from "../shell/StickyAction";
import type { SiteDetailResponse } from "@/app/api/site-detail/route";

const MARKET_BLOCKS = [
  "zoning",
  "geometry",
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

  // The subject arrives settled from the shell's global search.
  const [lastInput, setLastInput] = useState<string | null>(null);
  usePendingSubject((payload, label) => {
    setLastInput(label);
    setDetail(null);
    setDetailError(null);
    stream.reset();
    setStarted(true);
    setActivePayload(payload);
    void stream.run(payload);
    void fetchDetail(payload);
  });

  const { result } = stream;
  const activeCandidate: AddressCandidate | null =
    activePayload && "candidate" in activePayload ? activePayload.candidate : null;
  const subjectAddress =
    result?.resolved_address.normalized ??
    detail?.resolved_address.normalized ??
    activeCandidate?.label ??
    null;
  useRegisterRun(stream, { subject: lastInput });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--ink-primary)",
            margin: "0 0 8px",
          }}
        >
          {c.label}
        </h1>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--ink-muted)",
            margin: 0,
          }}
        >
          {c.audience}
        </p>
      </div>

      <LocationConfidenceNote confidence={detail?.resolved_address?.location_confidence} />

      {!started && (
        /* Empty state — approved copy (KOANO_COPY.md) */
        <div style={{ maxWidth: "620px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 500, color: "var(--ink-primary)", margin: "0 0 8px" }}>
            Start with an address: search above, or from the Search tab on a phone.
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
            runStatus={stream.status}
            id="c2-pricing"
          />
          <PermitTrend detail={detail} id="c2-permits" />
          <NarrativePanel address={subjectAddress} candidate={activeCandidate} id="c2-narrative" />
          {subjectAddress && <StickyAction label="Documents" targetId="c2-documents" hint="Neighborhood report, pricing sheet, net sheet, CMA" />}

          {/* Downloadable documents — grouped, matching the Cluster 1 & 5 pattern */}
          {subjectAddress && (
            <div id="c2-documents" className="lens-documents" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
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
                <DocumentButton
                  docType="cma"
                  title="Comparative Market Analysis"
                  address={subjectAddress}
                  formats={["pdf", "docx"]}
                  hasRecentVerdict={true}
                  sourceCopy={{
                    verdict: { title: "Deterministic narrative", body: "The comps, the band and the market narrative written from the record alone. No generation used." },
                    fresh: { title: "Model-written narrative", body: "The same figures with a model-written market narrative. Uses one generation." },
                  }}
                  id="c2-cma-doc"
                />
              </div>
            </div>
          )}

          {/* Verdict pipeline */}
        </>
      )}

      <VerdictHistory id="c2-history" />
    </div>
  );
}
