"use client";

// SitePanels — Cluster 4 development facts for one site (Checkpoint 3).
// Entitlement risk (Regulatory & Policy agent), zoning envelope, permit
// history, and pro forma benchmarks. Every panel carries its provenance
// badge; the pro forma panel is representative until CoStar-tier data is
// funded and says so (Section 08, Cluster 4 data reality).

import React from "react";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import { swapIntegrationFor, type SynthesisResult } from "@/components/ui/verdict";
import {
  BlockError,
  Meter,
  PanelHeader,
  Row,
  fmtInt,
  fmtMoney,
  fmtPct,
  panelStyle,
  riskColor,
} from "../panels";
import PermitHistoryPanel from "../PermitHistoryPanel";
import type { SiteDetailResponse } from "@/app/api/site-detail/route";

interface SitePanelsProps {
  detail: SiteDetailResponse | null;
  detailError: string | null;
  verdict: SynthesisResult;
}

export default function SitePanels({ detail, detailError, verdict }: SitePanelsProps) {
  const regPolicy = verdict.agent_summaries.find((s) => s.agent === "regulatory-policy");
  const zoning = detail?.zoning;
  const permits = detail?.permits;
  const oz = detail?.opportunity_zone;
  const proforma = detail?.proforma;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "16px",
      }}
    >
      {/* Entitlement risk — scored by the Regulatory & Policy agent */}
      <div style={panelStyle} id="c4-entitlement">
        <PanelHeader
          title="Entitlement risk — Regulatory & Policy agent"
          provenance={regPolicy?.overall_provenance}
        />
        {regPolicy ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "28px",
                  fontWeight: 500,
                  color: riskColor(regPolicy.risk_score),
                }}
              >
                {regPolicy.risk_score}/100
              </span>
              <span style={{ fontSize: "13px", color: "var(--ink-muted)" }}>
                confidence {regPolicy.confidence}
              </span>
            </div>
            <Meter value={regPolicy.risk_score} color={riskColor(regPolicy.risk_score)} />
            <p style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--ink-secondary)", margin: 0 }}>
              {regPolicy.headline}
            </p>
          </>
        ) : (
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
            No Regulatory & Policy output in this verdict.
          </p>
        )}
        {oz?.data && (
          <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "12px" }}>
            <Row
              label="Opportunity Zone"
              value={
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  {oz.data.is_opportunity_zone ? "Yes" : "No"}
                  <ProvenanceBadge provenance={oz.provenance} />
                </span>
              }
            />
          </div>
        )}
      </div>

      {/* Zoning envelope — live NYC PLUTO */}
      {zoning && zoning.ok && zoning.data ? (
        <div style={panelStyle}>
          <PanelHeader title={`Zoning — ${zoning.source}`} provenance={zoning.provenance} />
          <Row
            label="District"
            value={
              zoning.data.zoning_district
                ? `${zoning.data.zoning_district}${zoning.data.commercial_overlay ? ` / ${zoning.data.commercial_overlay}` : ""}`
                : "—"
            }
          />
          {zoning.data.special_district && (
            <Row label="Special district" value={zoning.data.special_district} />
          )}
          <Row
            label="Built FAR / max residential FAR"
            value={`${zoning.data.built_far ?? "—"} / ${zoning.data.max_residential_far ?? "—"}`}
          />
          <Row label="Unused FAR" value={fmtPct(zoning.data.unused_far_pct)} />
          <Row label="Lot area" value={`${fmtInt(zoning.data.lot_area_sqft)} sq ft`} />
          <Row label="Year built" value={zoning.data.year_built ?? "—"} />
          <Row label="Residential units" value={fmtInt(zoning.data.residential_units)} />
        </div>
      ) : (
        <BlockError title="Zoning" error={detailError ?? zoning?.error} />
      )}

      {/* Permit history — live NYC DOB (shared panel) */}
      <PermitHistoryPanel permits={permits} error={detailError} />

      {/* Pro forma benchmarks — representative until CoStar-tier data is funded */}
      {proforma && proforma.data ? (
        <div style={panelStyle} id="c4-proforma">
          <PanelHeader
            title="Pro forma benchmarks"
            provenance={proforma.provenance}
            becomesLiveWith={swapIntegrationFor([proforma.source])}
          />
          <Row label="Submarket profile" value={proforma.data.submarket} />
          <Row
            label="Land cost / buildable sq ft"
            value={fmtMoney(proforma.data.land_cost_per_buildable_sf)}
          />
          <Row
            label="Construction cost / sq ft"
            value={fmtMoney(proforma.data.construction_cost_per_sf)}
          />
          <Row label="Exit cap rate" value={fmtPct(proforma.data.exit_cap_rate_pct)} />
          <Row
            label="Absorption"
            value={`${proforma.data.absorption_units_per_month} units / mo`}
          />
          {proforma.provenance !== "live" && (
            <p style={{ fontSize: "12px", color: "var(--ink-muted)", margin: 0 }}>
              Representative data — becomes live with{" "}
              {swapIntegrationFor([proforma.source]) ?? "a paid benchmark source"} integration.
            </p>
          )}
        </div>
      ) : (
        <BlockError title="Pro forma benchmarks" error={detailError ?? proforma?.error} />
      )}
    </div>
  );
}
