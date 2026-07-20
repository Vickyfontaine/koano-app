"use client";

// ViolationsPanel — Cluster 1 building violation history (live NYC data).
// The HPD scope statement is mandatory: HPD violations only apply to
// registered multiple dwellings (3+ units), so a legitimate zero must never
// read as broken or as a clean bill of health.

import React from "react";
import { BlockError, PanelHeader, Row, fmtInt, panelStyle, panelTitle, riskColor } from "../panels";
import type { SiteDetailBlock } from "@/app/api/site-detail/route";
import type { BuildingViolationsSummary } from "../../../../lib/providers/types";

interface ViolationsPanelProps {
  violations?: SiteDetailBlock<BuildingViolationsSummary>;
  error?: string | null;
  id?: string;
}

export default function ViolationsPanel({ violations, error, id }: ViolationsPanelProps) {
  if (!violations || !violations.data) {
    return <BlockError title="Building violations" error={error ?? violations?.error} />;
  }
  const v = violations.data;
  const openTotal = v.hpd.open;
  const trendRising = v.hpd.last_24mo > v.hpd.prior_24mo;

  return (
    <div style={panelStyle} id={id}>
      <PanelHeader title="Building violations" provenance={violations.provenance} />

      {/* HPD */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <span style={panelTitle}>HPD housing maintenance</span>
        {v.hpd_registered ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "26px",
                  fontWeight: 500,
                  color: openTotal > 0 ? riskColor(Math.min(100, openTotal * 2)) : "var(--signal-positive)",
                }}
              >
                {fmtInt(openTotal)} open
              </span>
              <span style={{ fontSize: "13px", color: "var(--ink-muted)" }}>
                of {fmtInt(v.hpd.total)} total
              </span>
            </div>
            <Row
              label="Open by class (C = immediately hazardous)"
              value={`C: ${v.hpd.open_by_class.C} · B: ${v.hpd.open_by_class.B} · A: ${v.hpd.open_by_class.A}`}
            />
            <Row
              label="Last 24 months vs prior 24"
              value={`${fmtInt(v.hpd.last_24mo)} vs ${fmtInt(v.hpd.prior_24mo)}${trendRising ? " · rising" : ""}`}
            />
            <Row label="Most recent inspection" value={v.hpd.most_recent_inspection ?? "—"} />
          </>
        ) : (
          <p style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--ink-muted)", margin: 0 }}>
            Not applicable — HPD violations only apply to registered multiple dwellings (3 or
            more units). This building is not in HPD&apos;s registry, so there is no HPD history
            to show. That is a coverage fact, not a clean record.
          </p>
        )}
      </div>

      {/* ECB + DOB */}
      <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <Row
          label="ECB violations (active / total)"
          value={`${fmtInt(v.ecb.active)} / ${fmtInt(v.ecb.total)}`}
        />
        {v.ecb.active > 0 && (
          <Row
            label="Active by severity"
            value={Object.entries(v.ecb.active_by_severity)
              .map(([k, n]) => `${k}: ${n}`)
              .join(" · ")}
          />
        )}
        <Row
          label="DOB complaints (active / total)"
          value={`${fmtInt(v.dob_complaints.active)} / ${fmtInt(v.dob_complaints.total)}`}
        />
      </div>

      {/* Recent items */}
      {v.recent_items.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "12px" }}>
          <div style={{ ...panelTitle, marginBottom: "8px" }}>Recent</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {v.recent_items.slice(0, 5).map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "10px", fontSize: "12px", color: "var(--ink-secondary)" }}>
                <span style={{ flex: 1 }}>
                  [{r.source}] {r.label}
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", color: "var(--ink-faint)", whiteSpace: "nowrap" }}>
                  {r.status} · {r.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={{ fontSize: "11px", color: "var(--ink-faint)", margin: 0 }}>
        HPD covers registered multiple dwellings (3+ units) only. {v.scope_note}
      </p>
    </div>
  );
}
