"use client";

// MarketVelocityPanel — Cluster 2 default view (Checkpoint 4).
// Market speed at a glance: live FHFA price velocity and search interest,
// representative DOM / $psf / absorption / foot traffic clearly badged.

import React from "react";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import type { Provenance } from "@/components/ui/verdict";
import { BlockError, PanelHeader, panelStyle } from "../panels";
import type { SiteDetailResponse } from "@/app/api/site-detail/route";

interface Tile {
  label: string;
  value: string;
  sub?: string;
  provenance: Provenance;
}

function StatTile({ tile }: { tile: Tile }) {
  return (
    <div
      style={{
        border: "1px solid var(--border-light)",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "10px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ink-faint)",
        }}
      >
        {tile.label}
      </span>
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "22px",
          fontWeight: 500,
          color: "var(--ink-primary)",
        }}
      >
        {tile.value}
      </span>
      {tile.sub && <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>{tile.sub}</span>}
      <ProvenanceBadge provenance={tile.provenance} />
    </div>
  );
}

interface MarketVelocityPanelProps {
  detail: SiteDetailResponse | null;
  detailError: string | null;
  id?: string;
}

export default function MarketVelocityPanel({ detail, detailError, id }: MarketVelocityPanelProps) {
  if (!detail) {
    return <BlockError title="Market velocity" error={detailError ?? undefined} />;
  }

  const tiles: Tile[] = [];
  const { hpi, mls_comps, search_trends, foot_traffic, proforma } = detail;

  if (hpi?.data) {
    tiles.push({
      label: "Price velocity (FHFA)",
      value: hpi.data.yoy_change_pct != null ? `${hpi.data.yoy_change_pct}% yoy` : "—",
      sub: `${hpi.data.region} · ${hpi.data.latest_period}${hpi.data.five_yr_change_pct != null ? ` · ${hpi.data.five_yr_change_pct}% 5yr` : ""}`,
      provenance: hpi.provenance,
    });
  }
  if (mls_comps?.data) {
    tiles.push({
      label: "Median days on market",
      value: `${mls_comps.data.median_dom} days`,
      sub: `trend: ${mls_comps.data.dom_trend}`,
      provenance: mls_comps.provenance,
    });
    tiles.push({
      label: "Median comp $/sq ft",
      value: `$${mls_comps.data.median_price_per_sqft.toLocaleString("en-US")}`,
      sub: "indicative benchmark",
      provenance: mls_comps.provenance,
    });
  }
  if (search_trends?.data) {
    tiles.push({
      label: "Search interest",
      value: `${search_trends.data.interest_current}/100`,
      sub: `"${search_trends.data.term}" · ${search_trends.data.momentum}`,
      provenance: search_trends.provenance,
    });
  }
  if (foot_traffic?.data) {
    tiles.push({
      label: "Foot traffic",
      value: `${foot_traffic.data.yoy_change_pct >= 0 ? "+" : ""}${foot_traffic.data.yoy_change_pct}% yoy`,
      sub: foot_traffic.data.area,
      provenance: foot_traffic.provenance,
    });
  }
  if (proforma?.data) {
    tiles.push({
      label: "Absorption",
      value: `${proforma.data.absorption_units_per_month} units/mo`,
      sub: proforma.data.submarket,
      provenance: proforma.provenance,
    });
  }

  return (
    <div style={panelStyle} id={id}>
      <PanelHeader title="Market velocity" />
      {tiles.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
          No velocity data available for this area.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
          }}
        >
          {tiles.map((t) => (
            <StatTile key={t.label} tile={t} />
          ))}
        </div>
      )}
    </div>
  );
}
