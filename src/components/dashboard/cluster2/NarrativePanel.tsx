"use client";

// NarrativePanel — Cluster 2 client-ready neighborhood narrative.
// Generated on demand by /api/narrative (runtime model, provider data only).
// Labeled as generated; provenance = weakest input; sources listed. Copyable.

import React, { useEffect, useState } from "react";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import type { Provenance, AddressCandidate } from "@/components/ui/verdict";
import { PanelHeader, panelStyle, panelTitle } from "../panels";
import { useUpgrade, isUpgradeRequired } from "../UpgradeProvider";

interface NarrativeResult {
  narrative: string;
  overall_provenance: Provenance;
  sources: string[];
  generated_at: string;
}

interface NarrativePanelProps {
  address: string | null; // normalized subject address (null until analysis runs)
  // When the subject came from a disambiguation pick, the narrative re-derives
  // its address server-side from the candidate (never trusts a client BBL).
  candidate?: AddressCandidate | null;
  id?: string;
}

export default function NarrativePanel({ address, candidate = null, id }: NarrativePanelProps) {
  const { openUpgrade } = useUpgrade();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<NarrativeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Clear any prior narrative when the subject changes — otherwise a failed or new
  // run leaves a previous building's narrative on screen with a LIVE badge over an
  // empty prompt. The narrative is generated fresh per subject, on demand.
  const subjectKey = candidate?.id ? `c:${candidate.id}:${candidate.label}` : address;
  useEffect(() => {
    setResult(null);
    setError(null);
    setCopied(false);
  }, [subjectKey]);

  const hasSubject = !!address || !!candidate;

  async function generate() {
    if (!hasSubject || busy) return;
    setBusy(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch("/api/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(candidate ? { candidate } : { address }),
      });
      const json = await res.json();
      // Free-tier limit → surface the upgrade screen, not a raw error.
      if (isUpgradeRequired(res.status, json)) {
        openUpgrade({ plan: json.plan, kind: json.kind, limit: json.limit });
        return;
      }
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
      <PanelHeader title="Neighborhood narrative: client-ready" />

      {!hasSubject && (
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
          Run an analysis above, then generate a narrative for the subject neighborhood.
        </p>
      )}

      {hasSubject && !result && (
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
            Written by KOANO from the fetched sources only. Takes a few seconds
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
              Generated by KOANO from the sources above. Review before sharing with a client.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
