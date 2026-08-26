"use client";

// VerdictHistory — the user's recent verdicts from the append-only audit
// trail (GET /api/verdicts). Shared by every cluster's "History" section.

import React, { useEffect, useState } from "react";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import VerdictMathPanel from "@/components/ui/VerdictMathPanel";
import { VERDICT_COLORS, type Verdict } from "@/components/ui/verdict";
import { PanelHeader, panelStyle } from "./panels";
import type { VerdictHistoryRow } from "@/app/api/verdicts/route";

// The grounding gate (commit 595ffdf, 2026-08-19T07:54:23Z) began checking every
// reasoning claim + headline against an actual data point — the fix that closed
// the coded-field→named-entity fabrication class (the "G"→Gowanus/Superfund/MIH
// defect). Verdicts generated BEFORE it may carry ungated narrative. The table is
// append-only (audit trail), so we MARK those rows rather than edit them — a
// reader sees the era's narrative was not gate-checked. No verdict falls in the
// commit→deploy window, so the commit timestamp is a clean boundary.
const GROUNDING_GATE_AT = "2026-08-19T07:54:23Z";

export default function VerdictHistory({ id }: { id?: string }) {
  const [rows, setRows] = useState<VerdictHistoryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/verdicts?limit=50");
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

  // Curate the VIEW only — the verdict record is never touched (append-only).
  async function setHidden(verdictId: string, hidden: boolean) {
    setBusyId(verdictId);
    // Optimistic: flip locally, revert on failure.
    setRows((prev) => prev && prev.map((r) => (r.id === verdictId ? { ...r, hidden } : r)));
    try {
      const res = await fetch("/api/verdicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verdict_id: verdictId, hidden }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setRows((prev) => prev && prev.map((r) => (r.id === verdictId ? { ...r, hidden: !hidden } : r)));
    } finally {
      setBusyId(null);
    }
  }

  const q = filter.trim().toLowerCase();
  const matches = (r: VerdictHistoryRow) =>
    !q || (r.address_normalized ?? r.address_input ?? "").toLowerCase().includes(q);
  const all = rows ?? [];
  const hiddenCount = all.filter((r) => r.hidden).length;
  const visible = all.filter((r) => matches(r) && (showHidden || !r.hidden));

  return (
    <div style={panelStyle} id={id}>
      <PanelHeader title="Verdict history: append-only audit trail" />

      {rows !== null && rows.length > 0 && (
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by address…"
            aria-label="Filter history by address"
            style={{
              flex: 1,
              minWidth: "200px",
              padding: "8px 14px",
              borderRadius: "100px",
              border: "1px solid var(--border)",
              background: "var(--white)",
              fontFamily: "inherit",
              fontSize: "13px",
              color: "var(--ink-primary)",
              outline: "none",
            }}
          />
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowHidden((v) => !v)}
              style={{
                border: "1px solid var(--border)",
                background: showHidden ? "var(--pale-wash)" : "transparent",
                borderRadius: "100px",
                padding: "7px 14px",
                fontFamily: "'DM Mono', monospace",
                fontSize: "11px",
                letterSpacing: "0.04em",
                color: "var(--ink-muted)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {showHidden ? `Hide ${hiddenCount} again` : `Show hidden (${hiddenCount})`}
            </button>
          )}
        </div>
      )}

      {error && (
        <p style={{ fontSize: "13px", color: "var(--signal-negative)", margin: 0 }}>{error}</p>
      )}
      {!error && rows === null && (
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>Loading…</p>
      )}
      {rows !== null && rows.length === 0 && (
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
          No verdicts yet. Run an analysis above.
        </p>
      )}
      {rows !== null && rows.length > 0 && visible.length === 0 && (
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
          {q ? `No history rows match "${filter.trim()}".` : "All rows are hidden. Use “Show hidden”."}
        </p>
      )}
      {rows !== null && visible.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {visible.map((r) => {
            const canExpand = Array.isArray(r.agent_summaries) && r.agent_summaries.length > 0;
            const expanded = expandedId === r.id;
            const preGate = new Date(r.created_at).getTime() < new Date(GROUNDING_GATE_AT).getTime();
            return (
              <div
                key={r.id}
                style={{
                  borderBottom: "1px solid var(--border-light)",
                  paddingBottom: "10px",
                  opacity: r.hidden ? 0.55 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
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
                  {preGate && (
                    <span
                      title="Generated before the grounding gate (2026-08-19). Its narrative was not checked claim-by-claim against the data, so the headline may contain unsourced assertions. The verdict math (Show math) is unaffected. It is deterministic from the stored votes."
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "10px",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        color: "var(--signal-warning)",
                        background: "var(--white)",
                        border: "1px solid var(--signal-warning)",
                        borderRadius: "100px",
                        padding: "2px 9px",
                      }}
                    >
                      Pre-grounding-gate
                    </span>
                  )}
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--ink-faint)" }}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                  {canExpand && (
                    <button
                      onClick={() => setExpandedId(expanded ? null : r.id)}
                      style={{
                        border: "1px solid var(--border)",
                        background: "transparent",
                        borderRadius: "100px",
                        padding: "3px 12px",
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "10px",
                        letterSpacing: "0.04em",
                        color: "var(--ink-muted)",
                        cursor: "pointer",
                      }}
                    >
                      {expanded ? "Hide math" : "Show math"}
                    </button>
                  )}
                  <button
                    onClick={() => setHidden(r.id, !r.hidden)}
                    disabled={busyId === r.id}
                    title={r.hidden ? "Unhide this row" : "Hide this row from the view (the verdict record is kept)"}
                    style={{
                      border: "1px solid var(--border)",
                      background: "transparent",
                      borderRadius: "100px",
                      padding: "3px 12px",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "10px",
                      letterSpacing: "0.04em",
                      color: "var(--ink-faint)",
                      cursor: busyId === r.id ? "wait" : "pointer",
                    }}
                  >
                    {r.hidden ? "Unhide" : "Hide"}
                  </button>
                </div>
                {expanded && canExpand && (
                  <div style={{ marginTop: "14px" }}>
                    <VerdictMathPanel
                      verdict={{
                        verdict: r.verdict as Verdict,
                        overall_provenance: r.overall_provenance,
                        agent_summaries: r.agent_summaries,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
