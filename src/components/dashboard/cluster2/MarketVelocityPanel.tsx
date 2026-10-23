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
  /** The unit, set beside the value in the caption size so the value never wraps. */
  unit?: string;
  sub?: string;
  provenance: Provenance;
}

function StatTile({ tile }: { tile: Tile }) {
  return (
    <div
      style={{
        border: "1px solid var(--border-light)",
        borderRadius: "var(--radius-inner)",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ink-muted)",
        }}
      >
        {tile.label}
      </span>
      <span className="velocity-value" style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)", minWidth: 0 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-data-l)",
            fontWeight: 500,
            color: "var(--ink-primary)",
            whiteSpace: "nowrap",
            lineHeight: 1.1,
          }}
        >
          {tile.value}
        </span>
        {tile.unit && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-data)", color: "var(--ink-muted)", whiteSpace: "nowrap" }}>
            {tile.unit}
          </span>
        )}
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
      value: hpi.data.yoy_change_pct != null ? `${hpi.data.yoy_change_pct}%` : "n/a",
      unit: hpi.data.yoy_change_pct != null ? "yoy" : undefined,
      sub: `${hpi.data.region} · ${hpi.data.latest_period}${hpi.data.five_yr_change_pct != null ? ` · ${hpi.data.five_yr_change_pct}% 5yr` : ""}`,
      provenance: hpi.provenance,
    });
  }
  if (mls_comps?.data && mls_comps.data.sales_count > 0) {
    tiles.push({
      label: "Recorded sales (ZIP, 12mo)",
      value: `${mls_comps.data.sales_count}`,
      unit: "sales",
      sub: `price trend: ${mls_comps.data.price_trend}`,
      provenance: mls_comps.provenance,
    });
    tiles.push({
      label: "Area median $/sq ft (12mo)",
      value: `$${mls_comps.data.median_price_per_sqft.toLocaleString("en-US")}`,
      unit: "/ sq ft",
      sub: "NYC DOF recorded sales",
      provenance: mls_comps.provenance,
    });
    // Recorded-sales VELOCITY from DOF (trailing 12mo ÷ 12). Live — it replaces
    // the old representative "absorption" figure. Labeled to NOT be read as true
    // absorption / months-of-supply (which needs active listings — the paid MLS
    // gap KOANO does not source).
    tiles.push({
      label: "Recorded sales velocity",
      value: `${(mls_comps.data.sales_count / 12).toFixed(1)}`,
      unit: "sales / mo",
      sub: "Trailing 12 mo (DOF) · not absorption / months-of-supply",
      provenance: mls_comps.provenance,
    });
  }
  if (mortgage_demand?.data) {
    const m = mortgage_demand.data;
    tiles.push({
      label: "Mortgage demand (HMDA)",
      value: m.originations_yoy_pct != null ? `${m.originations_yoy_pct >= 0 ? "+" : ""}${m.originations_yoy_pct}%` : `${m.originations.toLocaleString("en-US")}`,
      unit: m.originations_yoy_pct != null ? "yoy" : "originations",
      sub: `${m.originations.toLocaleString("en-US")} originations · ${m.denial_rate_pct ?? "n/a"}% denied · ${m.year}`,
      provenance: mortgage_demand.provenance,
    });
  }
  if (employment?.data) {
    const e = employment.data;
    tiles.push({
      label: "Employment (QCEW)",
      value: e.employment_yoy_pct != null ? `${e.employment_yoy_pct >= 0 ? "+" : ""}${e.employment_yoy_pct}%` : "n/a",
      unit: e.employment_yoy_pct != null ? "yoy" : undefined,
      sub: `${e.total_employment?.toLocaleString("en-US") ?? "n/a"} jobs · wage ${e.avg_weekly_wage_yoy_pct != null ? `${e.avg_weekly_wage_yoy_pct >= 0 ? "+" : ""}${e.avg_weekly_wage_yoy_pct}%` : "n/a"} · ${e.period}`,
      provenance: employment.provenance,
    });
  }
  return (
    <div style={panelStyle} id={id}>
      <PanelHeader title="Market velocity" sub="How fast this market is moving, from the public record" />
      {tiles.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
          No velocity data available for this area.
        </p>
      ) : (
        <div className="velocity-grid">
          {tiles.map((t) => (
            <StatTile key={t.label} tile={t} />
          ))}
        </div>
      )}
    </div>
  );
}
