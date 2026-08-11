"use client";

// CmaBuilder — Cluster 2 (Checkpoint 4).
// Comparable sales with an early-signal overlay. THE INTEGRITY LINE (Section
// 08, Cluster 2): MLS comps are paid and legally gated — until funded, comps
// are representative and are labeled so prominently. Never implies live MLS
// access. The early signals ARE live (permits, price index, search interest):
// they lead the MLS, which is the product's edge.

import React from "react";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import { BlockError, PanelHeader, Row, fmtInt, fmtMoney, panelStyle, panelTitle } from "../panels";
import { deriveAlerts } from "../cluster1/AlertsPanel";
import type { SiteDetailResponse } from "@/app/api/site-detail/route";

interface CmaBuilderProps {
  detail: SiteDetailResponse | null;
  detailError: string | null;
  id?: string;
}

export default function CmaBuilder({ detail, detailError, id }: CmaBuilderProps) {
  if (!detail) {
    return <BlockError title="CMA builder" error={detailError ?? undefined} />;
  }

  const comps = detail.mls_comps;
  const zoning = detail.zoning;
  // Early signals: live-provenance leading indicators only.
  const earlySignals = deriveAlerts(detail).filter((a) => a.provenance === "live");

  return (
    <div style={panelStyle} id={id}>
      <PanelHeader title="CMA builder" provenance={comps?.provenance} />

      {/* Subject property — live PLUTO */}
      {zoning?.data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ ...panelTitle }}>
            Subject property{" "}
            <ProvenanceBadge provenance={zoning.provenance} />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "6px 24px",
            }}
          >
            <Row label="Building area" value={`${fmtInt(zoning.data.building_area_sqft)} sq ft`} />
            <Row label="Residential units" value={fmtInt(zoning.data.residential_units)} />
            <Row label="Year built" value={zoning.data.year_built ?? "—"} />
            <Row label="Zoning" value={zoning.data.zoning_district ?? "—"} />
          </div>
        </div>
      )}

      {/* Comparable sales — LIVE NYC recorded sales (DOF Rolling Sales) */}
      {comps?.data && comps.data.comps.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div
            style={{
              borderLeft: "3px solid var(--mid-blue)",
              background: "var(--pale-wash)",
              borderRadius: "0 12px 12px 0",
              padding: "10px 14px",
              fontSize: "12px",
              color: "var(--ink-secondary)",
            }}
          >
            Live recorded residential sales from NYC public records. {comps.data.scope_note}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "520px" }}>
              <thead>
                <tr>
                  {["Comparable", "Sale price", "Sale date", "Sq ft", "$/sq ft"].map((h) => (
                    <th
                      key={h}
                      style={{
                        ...panelTitle,
                        textAlign: "left",
                        padding: "8px 12px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comps.data.comps.map((comp, i) => (
                  <tr key={i}>
                    <td style={{ padding: "10px 12px", fontSize: "13px", color: "var(--ink-secondary)", borderBottom: "1px solid var(--border-light)" }}>
                      {comp.address}
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "var(--ink-primary)", borderBottom: "1px solid var(--border-light)" }}>
                      {fmtMoney(comp.sale_price)}
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "var(--ink-muted)", borderBottom: "1px solid var(--border-light)" }}>
                      {comp.sale_date}
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "var(--ink-primary)", borderBottom: "1px solid var(--border-light)" }}>
                      {fmtInt(comp.gross_square_feet)}
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "var(--ink-primary)", borderBottom: "1px solid var(--border-light)" }}>
                      {fmtMoney(comp.price_per_sqft)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Row label="Median" value={`${fmtMoney(comps.data.median_price_per_sqft)}/sq ft · ${comps.data.sales_count} sales · ${comps.data.price_trend}`} />
        </div>
      ) : comps?.data ? (
        // Live result with no qualifying comps — a coverage fact, not a failure.
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
          {comps.data.scope_note}
        </p>
      ) : (
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
          Comparables unavailable{comps?.error ? `: ${comps.error}` : ""}.
        </p>
      )}

      {/* Early-signal overlay — live indicators that lead the MLS */}
      <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <span style={panelTitle}>Early-signal overlay — live indicators that lead the MLS</span>
        {earlySignals.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
            No live leading signals in the fetched data.
          </p>
        ) : (
          earlySignals.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span
                aria-hidden="true"
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  marginTop: "6px",
                  flexShrink: 0,
                  background:
                    s.severity === "positive"
                      ? "var(--signal-positive)"
                      : s.severity === "negative"
                        ? "var(--signal-negative)"
                        : s.severity === "warning"
                          ? "var(--signal-warning)"
                          : "var(--mid-blue)",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--ink-secondary)" }}>
                  {s.text}
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "var(--ink-faint)" }}>
                  {s.source}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
