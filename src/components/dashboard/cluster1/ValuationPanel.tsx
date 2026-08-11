"use client";

// ValuationPanel — Cluster 1 honest AVM (Checkpoint 4).
// KOANO does not have a paid AVM yet (Section 07: paid AVM is representative
// until funded), so the valuation is assembled transparently from its parts:
//   - Indicative value = median comp $/sq ft (representative MLS stand-in)
//     × building area (live NYC PLUTO). Badged representative — the math is
//     shown, never presented as a live appraisal.
//   - Tract median home value from Census ACS (live).
//   - Velocity from the FHFA House Price Index (live, metro scope).

import React from "react";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import { BlockError, PanelHeader, Row, fmtInt, fmtMoney, panelStyle } from "../panels";
import type { SiteDetailResponse } from "@/app/api/site-detail/route";

interface ValuationPanelProps {
  detail: SiteDetailResponse | null;
  detailError: string | null;
  id?: string;
}

export default function ValuationPanel({ detail, detailError, id }: ValuationPanelProps) {
  const comps = detail?.mls_comps;
  const zoning = detail?.zoning;
  const acs = detail?.demographics;
  const hpi = detail?.hpi;

  if (!detail) {
    return <BlockError title="Valuation" error={detailError ?? undefined} />;
  }

  const psf = comps?.data?.median_price_per_sqft ?? null;
  const sqft = zoning?.data?.building_area_sqft ?? null;
  const indicative = psf != null && sqft != null && sqft > 0 ? Math.round(psf * sqft) : null;

  return (
    <div style={panelStyle} id={id}>
      <PanelHeader title="Valuation" />

      {/* Indicative value — live recorded-sale $/sq ft × live PLUTO area */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "32px",
              fontWeight: 500,
              color: "var(--ink-primary)",
            }}
          >
            {indicative != null ? fmtMoney(indicative) : "—"}
          </span>
          {comps && <ProvenanceBadge provenance={comps.provenance} />}
        </div>
        <p style={{ fontSize: "12px", color: "var(--ink-muted)", margin: "6px 0 0" }}>
          Indicative value: median recorded-sale {psf != null ? fmtMoney(psf) : "—"}/sq ft ×{" "}
          {sqft != null ? fmtInt(sqft) : "—"} sq ft building area (live PLUTO).
          {comps?.provenance !== "live" && (
            <> Representative fallback — live NYC recorded sales were unavailable for this request.</>
          )}
        </p>
      </div>

      <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {comps?.data && comps.data.sales_count > 0 && (
          <Row
            label="Recorded residential sales (ZIP, 12mo)"
            value={
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                {fmtInt(comps.data.sales_count)} sales · {comps.data.price_trend}
                <ProvenanceBadge provenance={comps.provenance} />
              </span>
            }
          />
        )}
        {acs?.data && (
          <Row
            label={`Tract median home value (${acs.data.vintage})`}
            value={
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                {fmtMoney(acs.data.median_home_value)}
                <ProvenanceBadge provenance={acs.provenance} />
              </span>
            }
          />
        )}
        {hpi?.data && (
          <>
            <Row
              label={`Price velocity — ${hpi.data.region} (${hpi.data.region_type}, FHFA HPI)`}
              value={
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  {hpi.data.yoy_change_pct != null ? `${hpi.data.yoy_change_pct}% yoy` : "—"}
                  {hpi.data.five_yr_change_pct != null ? ` · ${hpi.data.five_yr_change_pct}% 5yr` : ""}
                  <ProvenanceBadge provenance={hpi.provenance} />
                </span>
              }
            />
          </>
        )}
      </div>

      <p style={{ fontSize: "11px", color: "var(--ink-faint)", margin: 0 }}>
        Assembled from the sources above, each badged with its provenance, not a live appraisal.
      </p>
    </div>
  );
}
