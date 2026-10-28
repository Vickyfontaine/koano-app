"use client";

// ProvenanceLedger — the expandable per-figure source table. A skeptical analyst
// tests exactly the numbers that depend on expensive data, so KOANO lays every
// figure open: its value, its provenance, and its source, grouped by agent, with
// a "show only non-live" filter to jump straight to what isn't live.
//
// It shows location_confidence ALONGSIDE provenance, because they answer
// different questions: provenance = is this number live from a real source;
// location_confidence = is it about the RIGHT building. A live figure about an
// UNCONFIRMED building must read differently from a live figure about a confirmed
// one — so when the address was resolved without a cross-check, every building-
// keyed figure carries the caveat, not just a badge that says "live".

import React, { useState } from "react";
import { useTrace } from "./trace/TraceProvider";
import { pointId } from "./trace/graph";
import { humanizeLabel } from "./humanize";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import { AGENT_LABELS, type AgentName, type LedgerDataPoint } from "@/components/ui/verdict";

interface ProvenanceLedgerProps {
  dataPoints?: LedgerDataPoint[];
  locationConfidence?: "confirmed" | "unconfirmed";
  address?: string | null;
  id?: string;
  defaultOpen?: boolean;
  /** False inside the evidence drawer: the panel is always open and has no toggle. */
  collapsible?: boolean;
  /** A replay of a frozen run (the marketing example): badges read "Recorded"
   *  and the live/non-live filter is hidden, so a recording never claims live. */
  recorded?: boolean;
}

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  letterSpacing: "0.04em",
};

const AGENT_ORDER: AgentName[] = [
  "market-timing",
  "infrastructure",
  "demand-sentiment",
  "risk-volatility",
  "regulatory-policy",
  "synthesis",
];

export default function ProvenanceLedger({ dataPoints, locationConfidence, address, id, defaultOpen, recorded = false, collapsible = true }: ProvenanceLedgerProps) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [nonLiveOnly, setNonLiveOnly] = useState(false);
  const trace = useTrace();

  const points = dataPoints ?? [];
  if (points.length === 0) return null;

  const liveCount = points.filter((d) => d.provenance === "live").length;
  // Non-live figures span coverage_absent / fetch_failed / representative — the
  // Coverage map above breaks them down by state; here we just count them, never
  // mislabeling all of them "representative".
  const nonLiveCount = points.length - liveCount;
  const unconfirmed = locationConfidence === "unconfirmed";

  const shown = nonLiveOnly ? points.filter((d) => d.provenance !== "live") : points;
  const byAgent = AGENT_ORDER.map((agent) => ({
    agent,
    rows: shown.filter((d) => d.agent === agent),
  })).filter((g) => g.rows.length > 0);

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-card)", background: "var(--white)", padding: "var(--panel-pad)" }} id={id}>
      <button
        onClick={() => collapsible && setOpen((v) => !v)}
        aria-expanded={collapsible ? open : undefined}
        disabled={!collapsible}
        style={{
          width: "100%",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "12px",
          padding: 0,
        }}
      >
        <span>
          <span style={{ ...mono, textTransform: "uppercase", color: "var(--ink-muted)" }}>Provenance ledger</span>
          <span style={{ fontSize: "13px", color: "var(--ink-muted)", marginLeft: "10px" }}>
            {recorded
              ? `${points.length} figures, each recorded with its source`
              : `${points.length} figures · ${liveCount} live${nonLiveCount > 0 ? ` · ${nonLiveCount} non-live` : ""}`}
          </span>
        </span>
        {collapsible && <span style={{ ...mono, color: "var(--mid-blue-ink)" }}>{open ? "Hide" : "Show every source"}</span>}
      </button>

      {open && (
        <div style={{ marginTop: "18px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Location confidence — shown ALONGSIDE provenance, at the run level. */}
          {unconfirmed ? (
            <div
              style={{
                border: "1px solid var(--border)",
                borderLeft: "3px solid var(--signal-warning)",
                borderRadius: "0 var(--radius-inner) var(--radius-inner) 0",
                padding: "12px 16px",
              }}
            >
              <p style={{ fontSize: "13px", lineHeight: 1.55, color: "var(--ink-secondary)", margin: 0 }}>
                <strong style={{ fontWeight: 500 }}>Location unverified.</strong> This address resolved
                from a single geocoder without a cross-check, so a <em>live</em> figure below may
                describe a nearby lot rather than this exact building. Provenance says the number is
                live; it does not say the building is right.
              </p>
            </div>
          ) : (
            address && (
              <p style={{ ...mono, color: "var(--ink-muted)", margin: 0 }}>
                {recorded ? "Recorded run" : "Location confirmed (two geocoders agreed)"} · every figure below is for {address}
              </p>
            )
          )}

          {!recorded && (
            <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input type="checkbox" checked={nonLiveOnly} onChange={(e) => setNonLiveOnly(e.target.checked)} />
              <span style={{ fontSize: "13px", color: "var(--ink-secondary)" }}>Show only non-live figures</span>
            </label>
          )}

          {byAgent.length === 0 && (
            <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>Every figure is live.</p>
          )}

          {byAgent.map((g) => (
            <div key={g.agent}>
              <div style={{ ...mono, color: "var(--mid-blue-ink)", marginBottom: "8px" }}>
                {AGENT_LABELS[g.agent] ?? g.agent}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {g.rows.map((d, i) => (
                  <div
                    key={`${d.label}-${i}`}
                    className="ledger-row"
                    data-trace={pointId(g.agent, d.label)}
                    tabIndex={trace.on ? 0 : undefined}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(160px, 1.4fr) minmax(80px, 1fr) auto minmax(120px, 1.2fr)",
                      gap: "12px",
                      alignItems: "baseline",
                      padding: "8px 0",
                      borderTop: "1px solid var(--border-light)",
                    }}
                  >
                    <span style={{ fontSize: "13px", color: "var(--ink-secondary)" }} title={d.label}>
                      {humanizeLabel(d.label)}
                    </span>
                    <span style={{ ...mono, fontSize: "12px", color: "var(--ink-primary)", wordBreak: "break-word" }}>
                      {String(d.value ?? "n/a")}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <ProvenanceBadge
                        provenance={d.provenance}
                        labelOverride={recorded ? "Recorded" : undefined}
                        noteOverride={recorded ? "Recorded from the August 2026 example run, with its source." : undefined}
                      />
                      {unconfirmed && (
                        <span
                          title="Location unverified. This figure may be for a nearby lot"
                          style={{ ...mono, fontSize: "11px", color: "var(--signal-warning-ink)", border: "1px solid var(--signal-warning)", borderRadius: "100px", padding: "2px 8px", textTransform: "uppercase" }}
                        >
                          loc?
                        </span>
                      )}
                    </span>
                    <span style={{ ...mono, fontSize: "11px", color: "var(--ink-muted)", wordBreak: "break-word" }}>
                      {d.source}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
