"use client";

// NarrativePanel — Cluster 2 client-ready neighborhood narrative.
// Generated on demand by /api/narrative (runtime model, provider data only).
// Labeled as generated; provenance = weakest input; sources listed. Copyable.

import React, { useState } from "react";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import type { Provenance } from "@/components/ui/verdict";
import { PanelHeader, panelStyle, panelTitle } from "../panels";

interface NarrativeResult {
  narrative: string;
  overall_provenance: Provenance;
  sources: string[];
  generated_at: string;
}

interface NarrativePanelProps {
  address: string | null; // normalized subject address (null until analysis runs)
  id?: string;
}

export default function NarrativePanel({ address, id }: NarrativePanelProps) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<NarrativeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!address || busy) return;
    setBusy(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch("/api/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
      setResult(json as NarrativeResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Narrative generation failed");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={panelStyle} id={id}>
      <PanelHeader title="Neighborhood narrative — client-ready" />

      {!address && (
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
          Run an analysis above, then generate a narrative for the subject neighborhood.
        </p>
      )}

      {address && !result && (
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <button
            className="btn-primary"
            onClick={generate}
            disabled={busy}
            style={{ opacity: busy ? 0.55 : 1, cursor: busy ? "wait" : "pointer" }}
          >
            {busy ? "Writing…" : "Generate narrative"}
            {!busy && <span aria-hidden="true">↗</span>}
          </button>
          <span style={{ fontSize: "12px", color: "var(--ink-faint)" }}>
            Written by KOANO from the fetched sources only — a few seconds
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
              fontSize: "15px",
              lineHeight: 1.7,
              color: "var(--ink-primary)",
              margin: 0,
              maxWidth: "680px",
              whiteSpace: "pre-wrap",
            }}
          >
            {result.narrative}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <ProvenanceBadge provenance={result.overall_provenance} showNote />
            <button
              onClick={copy}
              style={{
                border: "1px solid var(--border)",
                background: "transparent",
                borderRadius: "100px",
                padding: "7px 16px",
                fontFamily: "inherit",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--ink-primary)",
                cursor: "pointer",
              }}
            >
              {copied ? "Copied" : "Copy text"}
            </button>
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
              {busy ? "Writing…" : "Regenerate"}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={panelTitle}>Written from</span>
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
              Generated by KOANO from the sources above — review before sharing with a client.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
