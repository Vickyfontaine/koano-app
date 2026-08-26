"use client";

// MultiSiteMap — Cluster 4 three-site comparison map. Each site is a subject pin;
// an Opportunity Zone shades its census tract (pale gold), and the subject tax
// lot is drawn as a navy footprint. The zoning district + FAR headroom — the
// entitlement signal the lot represents — ride in the pin tooltip. Every layer
// is live (Census TIGERweb tract, NYC DCP MapPLUTO lot); a site with no NYC lot
// simply shows a pin, never a fabricated shape.

import React from "react";
import KoanoMap, {
  type MapLegendItem,
  type MapMarker,
  type MapPolygonLayer,
} from "@/components/ui/map/KoanoMap";
import { OZ_FILL, LOT_LINE } from "@/components/ui/map/mapColors";
import type { SiteDetailResponse } from "@/app/api/site-detail/route";

export interface MultiSite {
  label: string; // "Site A"
  detail: SiteDetailResponse | null;
  verdict?: string | null;
  rank?: number | null;
}

const NYC_DEFAULT: [number, number] = [-73.96, 40.71];

function hasCoords(d: SiteDetailResponse | null): d is SiteDetailResponse {
  return (
    !!d &&
    typeof d.resolved_address.latitude === "number" &&
    typeof d.resolved_address.longitude === "number" &&
    Number.isFinite(d.resolved_address.latitude) &&
    Number.isFinite(d.resolved_address.longitude)
  );
}

export default function MultiSiteMap({ sites }: { sites: MultiSite[] }) {
  const withCoords = sites.filter((s) => hasCoords(s.detail));
  if (withCoords.length === 0) return null;

  const markers: MapMarker[] = [];
  const polygons: MapPolygonLayer[] = [];
  let anyOz = false;
  let anyLot = false;

  withCoords.forEach((s, i) => {
    const d = s.detail as SiteDetailResponse;
    const addr = d.resolved_address;
    const oz = d.opportunity_zone?.data;
    const z = d.zoning?.data;
    const geo = d.geometry?.data;
    const geoProv = d.geometry?.provenance ?? "live";
    const isOz = !!oz?.is_opportunity_zone;

    const zoningLine = z?.zoning_district
      ? `Zoning ${z.zoning_district}${z.unused_far_pct != null ? ` · ${z.unused_far_pct}% unused FAR` : ""}`
      : "Zoning: n/a";
    const title = [
      `${s.label}${s.rank ? ` · rank ${s.rank}` : ""}`,
      addr.normalized || addr.input,
      s.verdict ? `Verdict: ${s.verdict.toUpperCase()}` : "",
      zoningLine,
      isOz ? "In an Opportunity Zone" : "",
    ]
      .filter(Boolean)
      .join("\n");

    markers.push({
      id: `site-${i}`,
      lon: addr.longitude as number,
      lat: addr.latitude as number,
      kind: "subject",
      provenance: "live",
      frame: true,
      title,
    });

    // OZ tract shading (only when the site is actually in an OZ and we have the tract polygon).
    if (isOz && geo?.tract_polygon) {
      anyOz = true;
      polygons.push({ id: `oz-${i}`, kind: "oz", provenance: geoProv, features: [{ geometry: geo.tract_polygon }] });
    }
    // Subject lot footprint.
    if (geo?.lot_polygon) {
      anyLot = true;
      polygons.push({ id: `lot-${i}`, kind: "lot", provenance: geoProv, features: [{ geometry: geo.lot_polygon }] });
    }
  });

  const center: [number, number] = [
    withCoords.reduce((s, x) => s + (x.detail!.resolved_address.longitude as number), 0) / withCoords.length,
    withCoords.reduce((s, x) => s + (x.detail!.resolved_address.latitude as number), 0) / withCoords.length,
  ];
  if (!Number.isFinite(center[0]) || !Number.isFinite(center[1])) {
    center[0] = NYC_DEFAULT[0];
    center[1] = NYC_DEFAULT[1];
  }

  const legend: MapLegendItem[] = [
    { label: `${withCoords.length} site${withCoords.length === 1 ? "" : "s"}`, kind: "subject", provenance: "live" },
  ];
  if (anyOz)
    legend.push({ label: "Opportunity Zone (tract)", kind: "flood", provenance: "live", accent: OZ_FILL, hideProvenanceDot: false });
  if (anyLot)
    legend.push({ label: "Subject lot", kind: "flood", provenance: "live", accent: LOT_LINE });

  return (
    <KoanoMap
      center={center}
      markers={markers}
      polygons={polygons}
      legend={legend}
      height={460}
      note="Sites, their Opportunity-Zone tract shading, and each subject lot: all live. Zoning + FAR headroom in each pin."
    />
  );
}
