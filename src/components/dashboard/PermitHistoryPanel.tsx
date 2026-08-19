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

  const d = permits.data;
  const allTime = d.all_permits.length;
  const mostRecent = d.all_permits[0]?.issuance_date?.slice(0, 10) || null;

  return (
    <div style={panelStyle} id={id}>
      <PanelHeader title="Permits" provenance={permits.provenance} />

      {/* Scope block 1 — THIS BUILDING, all-time. Explicitly labeled so the
          neighborhood counts below are never read as the building's own record. */}
      <div style={{ ...panelTitle, marginBottom: "2px" }}>This building — all-time</div>
      <Row label="Permits on record" value={fmtInt(allTime)} />
      <Row label="Most recent permit" value={mostRecent ?? "— none on record"} />
      <p style={{ fontSize: "11px", color: "var(--ink-faint)", margin: "0 0 4px" }}>
        DOB NOW (2021+) merged with DOB&rsquo;s legacy permit dataset, which is frozen at June 2020.
        A short or empty history reflects permits filed, not all work done.
      </p>

      {/* Scope block 2 — NEIGHBORHOOD, last 24 months. */}
      <div
        style={{
          ...panelTitle,
          marginBottom: "2px",
          borderTop: "1px solid var(--border-light)",
          paddingTop: "12px",
        }}
      >
        Neighborhood — last 24 months
      </div>
      <Row label="Permits in the area" value={fmtInt(d.total_permits_24mo)} />
      <Row label="New building" value={fmtInt(d.new_building_permits)} />
      <Row label="Demolition" value={fmtInt(d.demolition_permits)} />
      <Row label="Alterations" value={fmtInt(d.alteration_permits)} />
      {d.recent_permits.length > 0 && (
        <div style={{ paddingTop: "8px" }}>
          <div style={{ ...panelTitle, marginBottom: "8px" }}>Recent — building &amp; nearby</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {d.recent_permits.slice(0, 5).map((p, i) => (
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
      <p style={{ fontSize: "11px", color: "var(--ink-faint)", margin: 0 }}>{d.scope_note}</p>
    </div>
  );
}
