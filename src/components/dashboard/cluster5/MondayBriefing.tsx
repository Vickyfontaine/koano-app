"use client";

// MondayBriefing — Cluster 5 (Checkpoint 4).
// Generated on demand from the portfolio's real data (latest verdicts, live
// permits/flood/HPI). Labeled as generated; provenance = weakest input;
// decision-support language enforced in the generator.

import React, { useState } from "react";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import type { Provenance } from "@/components/ui/verdict";
import { PanelHeader, panelStyle, panelTitle } from "../panels";

interface BriefingResult {
  briefing: string;
  overall_provenance: Provenance;
  sources: string[];
  properties_covered: number;
  generated_at: string;
}

interface MondayBriefingProps {
  hasProperties: boolean;
  id?: string;
}

export default function MondayBriefing({ hasProperties, id }: MondayBriefingProps) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BriefingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/briefing", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
      setResult(json as BriefingResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Briefing generation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={panelStyle} id={id}>
      <PanelHeader title="Monday briefing" />

      {!hasProperties && (
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
          Track at least one property to generate a portfolio briefing.
        </p>
      )}

      {hasProperties && !result && (
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <button
            className="btn-primary"
            onClick={generate}
            disabled={busy}
            style={{ opacity: busy ? 0.55 : 1, cursor: busy ? "wait" : "pointer" }}
          >
            {busy ? "Compiling…" : "Generate briefing"}
            {!busy && <span aria-hidden="true">↗</span>}
          </button>
          <span style={{ fontSize: "12px", color: "var(--ink-faint)" }}>
            Compiled from your portfolio&apos;s latest verdicts and live permit, flood, and price data
          </span>
        </div>
      )}

      {error && (
        <p style={{ fontSize: "13px", color: "var(--signal-negative)", margin: 0 }}>{error}</p>
      )}

      {result && (
        <>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              color: "var(--ink-faint)",
              margin: 0,
            }}
          >
            Generated {new Date(result.generated_at).toLocaleString()} · {result.properties_covered}{" "}
            propert{result.properties_covered === 1 ? "y" : "ies"} covered
          </p>
          <div
            style={{
              fontSize: "15px",
              lineHeight: 1.7,
              color: "var(--ink-primary)",
              maxWidth: "720px",
              whiteSpace: "pre-wrap",
            }}
          >
            {result.briefing}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <ProvenanceBadge provenance={result.overall_provenance} showNote />
            <button
              onClick={generate}
              disabled={busy}
              style={{
                border: "1px solid var(--border)",
                background: "transparent",
                borderRadius: "100px",
                padding: "7px 16px",
                fontFamily: "inherit",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--ink-muted)",
                cursor: busy ? "wait" : "pointer",
              }}
            >
              {busy ? "Compiling…" : "Regenerate"}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={panelTitle}>Compiled from</span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {result.sources.map((s) => (
                <span
                  key={s}
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "10px",
                    letterSpacing: "0.04em",
                    color: "var(--ink-muted)",
                    background: "var(--pale-wash)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "100px",
                    padding: "2px 9px",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
            <p style={{ fontSize: "11px", color: "var(--ink-faint)", margin: 0 }}>
              Generated by KOANO from the sources above. Decision support, not investment advice.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
