"use client";

// VerdictHistory — the user's recent verdicts from the append-only audit
// trail (GET /api/verdicts). Shared by every cluster's "History" section.

import React, { useEffect, useState } from "react";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import { VERDICT_COLORS, type Verdict } from "@/components/ui/verdict";
import { PanelHeader, panelStyle } from "./panels";
import type { VerdictHistoryRow } from "@/app/api/verdicts/route";

export default function VerdictHistory({ id }: { id?: string }) {
  const [rows, setRows] = useState<VerdictHistoryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/verdicts?limit=20");
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
        if (!cancelled) setRows(json.verdicts as VerdictHistoryRow[]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load history");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={panelStyle} id={id}>
      <PanelHeader title="Verdict history — append-only audit trail" />
      {error && (
        <p style={{ fontSize: "13px", color: "var(--signal-negative)", margin: 0 }}>{error}</p>
      )}
      {!error && rows === null && (
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>Loading…</p>
      )}
      {rows !== null && rows.length === 0 && (
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
          No verdicts yet — run an analysis above.
        </p>
      )}
      {rows !== null && rows.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {rows.map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "12px",
                flexWrap: "wrap",
                borderBottom: "1px solid var(--border-light)",
                paddingBottom: "10px",
              }}
            >
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "12px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  color: VERDICT_COLORS[r.verdict as Verdict] ?? "var(--ink-primary)",
                  minWidth: "44px",
                }}
              >
                {r.verdict}
              </span>
              <span style={{ fontSize: "13px", color: "var(--ink-secondary)", flex: 1, minWidth: "200px" }}>
                {r.address_normalized ?? r.address_input}
              </span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--ink-muted)" }}>
                conf {r.confidence} · risk {r.risk_score} · {r.signal_window_months} mo
              </span>
              <ProvenanceBadge provenance={r.overall_provenance} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--ink-faint)" }}>
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
