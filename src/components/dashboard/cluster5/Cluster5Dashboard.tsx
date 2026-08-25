"use client";

// Cluster 5 — Portfolio Intelligence dashboard (Checkpoint 4).
// Full-screen neural map as the hero (Section 08 cluster-to-map table),
// portfolio command center, Monday briefing, risk monitor. Strictest
// liability posture: every figure traceable and badged; decision-support
// language throughout.

import React, { useCallback, useEffect, useState } from "react";
import LoadingState from "@/components/ui/LoadingState";
import VerdictCard from "@/components/ui/VerdictCard";
import RunDegradationNote from "@/components/ui/RunDegradationNote";
import ProvenanceLedger from "@/components/ui/ProvenanceLedger";
import VerdictMathPanel from "@/components/ui/VerdictMathPanel";
import ReasoningChain from "@/components/ui/ReasoningChain";
import { CLUSTERS } from "../clusters";
import { useVerdictStream } from "../useVerdictStream";
import type { RunPayload } from "../useAddressResolver";
import VerdictHistory from "../VerdictHistory";
import PortfolioOverview from "./PortfolioOverview";
import PortfolioMap from "./PortfolioMap";
import MonitoringFeed from "./MonitoringFeed";
import ArchiveTrend from "./ArchiveTrend";
import MondayBriefing from "./MondayBriefing";
import RiskMonitor from "./RiskMonitor";
import DocumentButton from "../DocumentButton";
import type { PortfolioProperty } from "@/app/api/properties/route";

export default function Cluster5Dashboard() {
  const c = CLUSTERS.cluster_5;
  const stream = useVerdictStream();
  const [properties, setProperties] = useState<PortfolioProperty[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analyzedAddress, setAnalyzedAddress] = useState<string | null>(null);

  const loadProperties = useCallback(async () => {
    try {
      const res = await fetch("/api/properties");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
      setProperties(json.properties as PortfolioProperty[]);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load portfolio");
    }
  }, []);

  useEffect(() => {
    void loadProperties();
  }, [loadProperties]);

  // Accepts a raw {address} (geocoded server-side) or a chosen {candidate}
  // (BBL re-derived server-side). PortfolioOverview does the resolve/disambiguate
  // step and calls this once the building is settled.
  async function addProperty(payload: RunPayload): Promise<string | null> {
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) return json?.error || `Request failed (${res.status})`;
      await loadProperties();
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Could not add property";
    }
  }

  async function removeProperty(id: string) {
    await fetch(`/api/properties?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await loadProperties();
  }

  async function analyze(property: PortfolioProperty) {
    const address = property.address_normalized ?? property.address_input;
    setAnalyzingId(property.id);
    setAnalyzedAddress(address);
    await stream.run(address);
    setAnalyzingId(null);
    await loadProperties(); // latest verdict updates in the table
  }

  const { status, result } = stream;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1160px" }}>
      {/* Hero: geographic portfolio risk map. (The neural "System view" was
          removed — decoration, not a decision surface.) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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

        <PortfolioMap properties={properties} loadError={loadError} />
      </div>

      <PortfolioOverview
        properties={properties}
        loadError={loadError}
        onAdd={addProperty}
        onRemove={removeProperty}
        onAnalyze={analyze}
        analyzingId={analyzingId}
        id="c5-portfolio"
      />

      {/* Active analysis */}
      {status === "running" && (
        <LoadingState
          phase={stream.phase}
          agents={stream.agents}
          startedAt={stream.startedAt}
          normalizedAddress={stream.normalized ?? analyzedAddress}
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
        </>
      )}

      <MondayBriefing hasProperties={!!properties && properties.length > 0} id="c5-briefing" />

      <MonitoringFeed id="c5-monitoring" />

      {/* Downloadable documents — portfolio briefing PDF + per-asset one-pager,
          matching the Cluster 1 grouped pattern. */}
      <div id="c5-documents" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
            Provenance-labeled PDFs. Every figure carries its source; the disclaimer footer is on
            every page.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          {properties && properties.length > 0 ? (
            <DocumentButton
              docType="monday_briefing_pdf"
              title="Monday Portfolio Briefing (PDF)"
              formats={["pdf"]}
              singleAction={true}
              id="c5-briefing-doc"
            />
          ) : (
            <div
              style={{
                border: "1px dashed var(--border)",
                borderRadius: "16px",
                padding: "20px",
                fontSize: "13px",
                color: "var(--ink-faint)",
              }}
            >
              Add properties to your portfolio to generate the Monday Briefing PDF.
            </div>
          )}
          {status === "done" && result ? (
            <DocumentButton
              docType="asset_one_pager"
              title="Asset One-Pager"
              address={result.resolved_address.normalized || result.resolved_address.input}
              formats={["pdf"]}
              singleAction={true}
              id="c5-onepager-doc"
            />
          ) : (
            <div
              style={{
                border: "1px dashed var(--border)",
                borderRadius: "16px",
                padding: "20px",
                fontSize: "13px",
                color: "var(--ink-faint)",
              }}
            >
              Analyze a property above to enable its one-pager.
            </div>
          )}
        </div>
      </div>

      <RiskMonitor properties={properties} id="c5-risk" />
      <ArchiveTrend id="c5-archive" />
      <VerdictHistory id="c5-history" />
    </div>
  );
}
