"use client";

// PermitHistoryPanel — live NYC DOB permit history for one property.
// Shared by Cluster 1 (single property) and Cluster 4 (per site).

import React from "react";
import { BlockError, PanelHeader, Row, fmtInt, panelStyle, panelTitle } from "./panels";
import type { SiteDetailBlock } from "@/app/api/site-detail/route";
import type { PermitsSummary } from "../../../lib/providers/types";

interface PermitHistoryPanelProps {
  permits?: SiteDetailBlock<PermitsSummary>;
  error?: string | null;
  id?: string;
}

export default function PermitHistoryPanel({ permits, error, id }: PermitHistoryPanelProps) {
  if (!permits || !permits.ok || !permits.data) {
    return <BlockError title="Permit history" error={error ?? permits?.error} />;
  }

  return (
    <div style={panelStyle} id={id}>
      <PanelHeader title={`Permit history — ${permits.source}`} provenance={permits.provenance} />
      <Row label="Permits, last 24 months" value={fmtInt(permits.data.total_permits_24mo)} />
      <Row label="New building" value={fmtInt(permits.data.new_building_permits)} />
      <Row label="Demolition" value={fmtInt(permits.data.demolition_permits)} />
      <Row label="Alterations" value={fmtInt(permits.data.alteration_permits)} />
      {permits.data.recent_permits.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "12px" }}>
          <div style={{ ...panelTitle, marginBottom: "8px" }}>Recent</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {permits.data.recent_permits.slice(0, 5).map((p, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "10px",
                  fontSize: "12px",
                  color: "var(--ink-secondary)",
                }}
              >
                <span>
                  {p.job_type}
                  {p.work_type ? ` · ${p.work_type}` : ""}
                  {p.permit_status ? ` · ${p.permit_status}` : ""}
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", color: "var(--ink-faint)" }}>
                  {p.issuance_date.slice(0, 10)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <p style={{ fontSize: "11px", color: "var(--ink-faint)", margin: 0 }}>
        {permits.data.scope_note}
      </p>
    </div>
  );
}
