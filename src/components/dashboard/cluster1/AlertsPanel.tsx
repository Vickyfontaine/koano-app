"use client";

// AlertsPanel — Cluster 1 property signals (Checkpoint 4).
// Every alert is derived deterministically from data fetched for this
// analysis — real numbers, each with its source and provenance. Nothing is
// invented and no timestamp is simulated; these are point-in-time signals,
// not continuous monitoring.

import React from "react";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import type { Provenance } from "@/components/ui/verdict";
import { BlockError, PanelHeader, panelStyle } from "../panels";
import type { SiteDetailResponse } from "@/app/api/site-detail/route";

type Severity = "positive" | "warning" | "negative" | "info";

interface AlertItem {
  severity: Severity;
  text: string;
  source: string;
  provenance: Provenance;
}

const SEVERITY_COLOR: Record<Severity, string> = {
  positive: "var(--signal-positive)",
  warning: "var(--signal-warning)",
  negative: "var(--signal-negative)",
  info: "var(--mid-blue)",
};

export function deriveAlerts(detail: SiteDetailResponse): AlertItem[] {
  const alerts: AlertItem[] = [];
  const { flood, permits, hpi, opportunity_zone, zoning, mls_comps, building_violations, landlord_portfolio } = detail;

  if (building_violations?.data) {
    const v = building_violations.data;
    if (v.hpd.open_by_class.C > 0) {
      alerts.push({
        severity: "negative",
        text: `${v.hpd.open_by_class.C} open class C (immediately hazardous) HPD violation${v.hpd.open_by_class.C === 1 ? "" : "s"} on this building`,
        source: building_violations.source,
        provenance: building_violations.provenance,
      });
    }
    if (v.hpd.last_24mo > v.hpd.prior_24mo && v.hpd.last_24mo >= 5) {
      alerts.push({
        severity: "warning",
        text: `HPD violations rising: ${v.hpd.last_24mo} in the last 24 months vs ${v.hpd.prior_24mo} in the prior 24`,
        source: building_violations.source,
        provenance: building_violations.provenance,
      });
    }
    if (v.ecb.active > 0) {
      alerts.push({
        severity: "warning",
        text: `${v.ecb.active} active ECB violation${v.ecb.active === 1 ? "" : "s"} with penalties possible`,
        source: building_violations.source,
        provenance: building_violations.provenance,
      });
    }
  }

  if (landlord_portfolio?.data) {
    const pf = landlord_portfolio.data;
    if (pf.on_speculation_watch_list) {
      alerts.push({
        severity: "negative",
        text: "This building is on the NYC Speculation Watch List (flagged speculative sale profile)",
        source: landlord_portfolio.source,
        provenance: landlord_portfolio.provenance,
      });
    }
    if (pf.portfolio_open_hpd_violations >= 50 && pf.portfolio_building_count > 1) {
      alerts.push({
        severity: "warning",
        text: `The registered owner's portfolio (${pf.portfolio_building_count}${pf.portfolio_truncated ? "+" : ""} buildings, exact-match floor) carries ${pf.portfolio_open_hpd_violations} open HPD violations`,
        source: landlord_portfolio.source,
        provenance: landlord_portfolio.provenance,
      });
    }
  }

  if (flood?.data) {
    alerts.push(
      flood.data.in_special_flood_hazard_area
        ? {
            severity: "negative",
            text: `Inside a FEMA Special Flood Hazard Area (zone ${flood.data.flood_zone ?? "unknown"})`,
            source: flood.source,
            provenance: flood.provenance,
          }
        : {
            severity: "positive",
            text: `Outside the FEMA Special Flood Hazard Area (zone ${flood.data.flood_zone ?? "unknown"})`,
            source: flood.source,
            provenance: flood.provenance,
          },
    );
  }

  if (permits?.data) {
    const p = permits.data;
    if (p.new_building_permits > 0) {
      alerts.push({
        severity: "warning",
        text: `${p.new_building_permits} new-building permit${p.new_building_permits === 1 ? "" : "s"} in the covered area in 24 months — construction activity nearby`,
        source: permits.source,
        provenance: permits.provenance,
      });
    }
    if (p.demolition_permits > 0) {
      alerts.push({
        severity: "warning",
        text: `${p.demolition_permits} demolition permit${p.demolition_permits === 1 ? "" : "s"} in the covered area in 24 months`,
        source: permits.source,
        provenance: permits.provenance,
      });
    }
  }

  if (hpi?.data && hpi.data.yoy_change_pct != null) {
    const yoy = hpi.data.yoy_change_pct;
    alerts.push({
      severity: yoy >= 3 ? "positive" : yoy < 0 ? "negative" : "info",
      text: `${hpi.data.region} home prices ${yoy >= 0 ? "up" : "down"} ${Math.abs(yoy)}% year over year (FHFA HPI, ${hpi.data.latest_period})`,
      source: hpi.source,
      provenance: hpi.provenance,
    });
  }

  if (opportunity_zone?.data?.is_opportunity_zone) {
    alerts.push({
      severity: "info",
      text: "This tract is a federally designated Opportunity Zone",
      source: opportunity_zone.source,
      provenance: opportunity_zone.provenance,
    });
  }

  if (zoning?.data?.unused_far_pct != null && zoning.data.unused_far_pct >= 50) {
    alerts.push({
      severity: "info",
      text: `${zoning.data.unused_far_pct}% of the lot's residential FAR is unused — development headroom on this parcel`,
      source: zoning.source,
      provenance: zoning.provenance,
    });
  }

  if (mls_comps?.data && mls_comps.data.dom_trend !== "flat") {
    alerts.push({
      severity: mls_comps.data.dom_trend === "compressing" ? "positive" : "warning",
      text: `Comparable days-on-market ${mls_comps.data.dom_trend} (median ${mls_comps.data.median_dom} days)`,
      source: mls_comps.source,
      provenance: mls_comps.provenance,
    });
  }

  return alerts;
}

interface AlertsPanelProps {
  detail: SiteDetailResponse | null;
  detailError: string | null;
  id?: string;
}

export default function AlertsPanel({ detail, detailError, id }: AlertsPanelProps) {
  if (!detail) {
    return <BlockError title="Alerts" error={detailError ?? undefined} />;
  }
  const alerts = deriveAlerts(detail);

  return (
    <div style={panelStyle} id={id}>
      <PanelHeader title="Alerts — derived from this analysis" />
      {alerts.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
          No notable signals in the fetched data.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {alerts.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <span
                aria-hidden="true"
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: SEVERITY_COLOR[a.severity],
                  marginTop: "6px",
                  flexShrink: 0,
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                <span style={{ fontSize: "14px", lineHeight: 1.5, color: "var(--ink-secondary)" }}>
                  {a.text}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "10px",
                    color: "var(--ink-faint)",
                  }}
                >
                  {a.source}
                  <ProvenanceBadge provenance={a.provenance} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <p style={{ fontSize: "11px", color: "var(--ink-faint)", margin: 0 }}>
        Point-in-time signals computed from the data fetched for this analysis.
      </p>
    </div>
  );
}
