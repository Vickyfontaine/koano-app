"use client";

// MarketVelocityPanel — Cluster 2 default view (Checkpoint 4).
// Market speed at a glance, all live: FHFA price velocity, DOF recorded-sales
// count / median $psf / sales velocity, HMDA mortgage demand, QCEW employment.
// (Sales velocity is recorded-sales/mo, deliberately NOT labeled absorption —
// true months-of-supply needs active listings, the paid MLS gap.)

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
  const { hpi, mls_comps, mortgage_demand, employment } = detail;

  if (hpi?.data) {
    tiles.push({
      label: "Price velocity (FHFA)",
      value: hpi.data.yoy_change_pct != null ? `${hpi.data.yoy_change_pct}% yoy` : "—",
      sub: `${hpi.data.region} · ${hpi.data.latest_period}${hpi.data.five_yr_change_pct != null ? ` · ${hpi.data.five_yr_change_pct}% 5yr` : ""}`,
      provenance: hpi.provenance,
    });
  }
  if (mls_comps?.data && mls_comps.data.sales_count > 0) {
    tiles.push({
      label: "Recorded sales (ZIP, 12mo)",
      value: `${mls_comps.data.sales_count}`,
      sub: `price trend: ${mls_comps.data.price_trend}`,
      provenance: mls_comps.provenance,
    });
    tiles.push({
      label: "Median recorded $/sq ft",
      value: `$${mls_comps.data.median_price_per_sqft.toLocaleString("en-US")}`,
      sub: "NYC DOF recorded sales",
      provenance: mls_comps.provenance,
    });
    // Recorded-sales VELOCITY from DOF (trailing 12mo ÷ 12). Live — it replaces
    // the old representative "absorption" figure. Labeled to NOT be read as true
    // absorption / months-of-supply (which needs active listings — the paid MLS
    // gap KOANO does not source).
    tiles.push({
      label: "Recorded sales velocity",
      value: `${(mls_comps.data.sales_count / 12).toFixed(1)} sales/mo`,
      sub: "Trailing 12 mo (DOF) · not absorption / months-of-supply",
      provenance: mls_comps.provenance,
    });
  }
  if (mortgage_demand?.data) {
    const m = mortgage_demand.data;
    tiles.push({
      label: "Mortgage demand (HMDA)",
      value: m.originations_yoy_pct != null ? `${m.originations_yoy_pct >= 0 ? "+" : ""}${m.originations_yoy_pct}% yoy` : `${m.originations.toLocaleString("en-US")}`,
      sub: `${m.originations.toLocaleString("en-US")} originations · ${m.denial_rate_pct ?? "—"}% denied · ${m.year}`,
      provenance: mortgage_demand.provenance,
    });
  }
  if (employment?.data) {
    const e = employment.data;
    tiles.push({
      label: "Employment (QCEW)",
      value: e.employment_yoy_pct != null ? `${e.employment_yoy_pct >= 0 ? "+" : ""}${e.employment_yoy_pct}% yoy` : "—",
      sub: `${e.total_employment?.toLocaleString("en-US") ?? "—"} jobs · wage ${e.avg_weekly_wage_yoy_pct != null ? `${e.avg_weekly_wage_yoy_pct >= 0 ? "+" : ""}${e.avg_weekly_wage_yoy_pct}%` : "—"} · ${e.period}`,
      provenance: employment.provenance,
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
