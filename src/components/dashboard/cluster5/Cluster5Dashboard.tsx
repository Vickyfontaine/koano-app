"use client";

// Cluster 5 — Portfolio Intelligence dashboard (Checkpoint 4).
// Full-screen neural map as the hero (Section 08 cluster-to-map table),
// portfolio command center, Monday briefing, risk monitor. Strictest
// liability posture: every figure traceable and badged; decision-support
// language throughout.

import React, { useCallback, useEffect, useState } from "react";
import LoadingState from "@/components/ui/LoadingState";
import VerdictCard from "@/components/ui/VerdictCard";
import ReasoningChain from "@/components/ui/ReasoningChain";
import { CLUSTERS } from "../clusters";
import { useVerdictStream } from "../useVerdictStream";
import VerdictHistory from "../VerdictHistory";
import PortfolioOverview from "./PortfolioOverview";
import MondayBriefing from "./MondayBriefing";
import RiskMonitor from "./RiskMonitor";
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

  async function addProperty(address: string): Promise<string | null> {
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
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
      {/* Full-screen neural map hero */}
      <div style={{ position: "relative" }}>
        <iframe
          src="/neural-map.html"
          title="KOANO system — agent and data source topology"
          style={{
            width: "100%",
            height: "62vh",
            border: "1px solid var(--border)",
            borderRadius: "20px",
            background: "var(--white)",
            display: "block",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "28px",
            left: "32px",
            pointerEvents: "none",
          }}
        >
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
          <ReasoningChain
            reasoningChain={result.verdict.reasoning_chain}
            minoritySignals={result.verdict.minority_signals}
            agentSummaries={result.verdict.agent_summaries}
          />
        </>
      )}

      <MondayBriefing hasProperties={!!properties && properties.length > 0} id="c5-briefing" />
      <RiskMonitor properties={properties} id="c5-risk" />
      <VerdictHistory id="c5-history" />
    </div>
  );
}
