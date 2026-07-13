"use client";

// PortfolioOverview — Cluster 5 command center table (Checkpoint 4).
// Tracked properties from the properties table, each joined to its latest
// verdict from the append-only audit trail. Every verdict chip carries its
// provenance badge.

import React, { useState } from "react";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import { VERDICT_COLORS, type Verdict } from "@/components/ui/verdict";
import { PanelHeader, panelStyle, panelTitle } from "../panels";
import type { PortfolioProperty } from "@/app/api/properties/route";

interface PortfolioOverviewProps {
  properties: PortfolioProperty[] | null;
  loadError: string | null;
  onAdd: (address: string) => Promise<string | null>; // returns error or null
  onRemove: (id: string) => Promise<void>;
  onAnalyze: (property: PortfolioProperty) => void;
  analyzingId: string | null;
  id?: string;
}

export default function PortfolioOverview({
  properties,
  loadError,
  onAdd,
  onRemove,
  onAnalyze,
  analyzingId,
  id,
}: PortfolioOverviewProps) {
  const [address, setAddress] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const a = address.trim();
    if (!a || adding) return;
    setAdding(true);
    setAddError(null);
    const err = await onAdd(a);
    if (err) setAddError(err);
    else setAddress("");
    setAdding(false);
  }

  return (
    <div style={panelStyle} id={id}>
      <PanelHeader title="Portfolio overview" />

      {/* Add property */}
      <form onSubmit={handleAdd} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Add a property — 175 3rd Street, Brooklyn, NY"
          disabled={adding}
          aria-label="Property address to track"
          style={{
            flex: 1,
            minWidth: "260px",
            padding: "11px 16px",
            borderRadius: "100px",
            border: "1px solid var(--border)",
            background: "var(--white)",
            fontFamily: "inherit",
            fontSize: "14px",
            color: "var(--ink-primary)",
            outline: "none",
          }}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={adding || !address.trim()}
          style={{ opacity: adding || !address.trim() ? 0.55 : 1, cursor: adding ? "wait" : "pointer" }}
        >
          {adding ? "Adding…" : "Track property"}
          {!adding && <span aria-hidden="true">↗</span>}
        </button>
      </form>
      {addError && (
        <p style={{ fontSize: "13px", color: "var(--signal-negative)", margin: 0 }}>{addError}</p>
      )}
      {loadError && (
        <p style={{ fontSize: "13px", color: "var(--signal-negative)", margin: 0 }}>{loadError}</p>
      )}

      {/* Holdings table */}
      {properties === null && !loadError ? (
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>Loading portfolio…</p>
      ) : properties && properties.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
          No tracked properties yet — add the first one above.
        </p>
      ) : properties && properties.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "640px" }}>
            <thead>
              <tr>
                {["Property", "BBL", "Latest verdict", "Risk", "Provenance", "As of", ""].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      ...panelTitle,
                      textAlign: "left",
                      padding: "8px 12px",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => {
                const v = p.latest_verdict;
                const busy = analyzingId === p.id;
                return (
                  <tr key={p.id}>
                    <td style={{ padding: "10px 12px", fontSize: "13px", color: "var(--ink-secondary)", borderBottom: "1px solid var(--border-light)" }}>
                      {p.address_normalized ?? p.address_input}
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "var(--ink-muted)", borderBottom: "1px solid var(--border-light)" }}>
                      {p.bbl ?? "—"}
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-light)" }}>
                      {v ? (
                        <span
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: "12px",
                            fontWeight: 500,
                            textTransform: "uppercase",
                            color: VERDICT_COLORS[v.verdict as Verdict] ?? "var(--ink-primary)",
                          }}
                        >
                          {v.verdict} · {v.confidence}
                        </span>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--ink-faint)" }}>not analyzed</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "var(--ink-primary)", borderBottom: "1px solid var(--border-light)" }}>
                      {v ? `${v.risk_score}/100` : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-light)" }}>
                      {v ? <ProvenanceBadge provenance={v.overall_provenance} /> : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--ink-faint)", borderBottom: "1px solid var(--border-light)" }}>
                      {v ? new Date(v.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-light)", whiteSpace: "nowrap" }}>
                      <button
                        onClick={() => onAnalyze(p)}
                        disabled={analyzingId !== null}
                        style={{
                          border: "1px solid var(--border)",
                          background: "transparent",
                          borderRadius: "100px",
                          padding: "6px 14px",
                          fontFamily: "inherit",
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "var(--ink-primary)",
                          cursor: analyzingId !== null ? "not-allowed" : "pointer",
                          marginRight: "6px",
                          opacity: analyzingId !== null && !busy ? 0.5 : 1,
                        }}
                      >
                        {busy ? "Analyzing…" : v ? "Re-run" : "Analyze"}
                      </button>
                      <button
                        onClick={() => void onRemove(p.id)}
                        disabled={busy}
                        style={{
                          border: "none",
                          background: "transparent",
                          fontFamily: "inherit",
                          fontSize: "12px",
                          color: "var(--ink-faint)",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <p style={{ fontSize: "11px", color: "var(--ink-faint)", margin: 0 }}>
        Verdicts come from the append-only audit trail; removing a property never removes its
        verdict records.
      </p>
    </div>
  );
}
