"use client";

// PropertyMap — Cluster 1 single-property map. Composes KoanoMap from live
// site-detail blocks: the subject point (geocoded), FEMA flood-hazard polygons,
// EPA cleanup sites, and mappable comparable sales. Each layer carries the
// provenance of the block it came from, straight onto the map.

import React from "react";
import KoanoMap, {
  type MapLegendItem,
  type MapMarker,
  type MapPolygonLayer,
} from "@/components/ui/map/KoanoMap";
import {
  COMP_GRADIENT_CSS,
  compDivergingColor,
  FLOOD_SFHA_FILL,
  FLOOD_SHADED_FILL,
} from "@/components/ui/map/mapColors";
import type { SiteDetailResponse } from "@/app/api/site-detail/route";

const SUPERFUND_RED = "#EF4444";
const BROWNFIELD_AMBER = "#F59E0B";

function money(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

const panelTitle: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: "10px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--ink-faint)",
};

export default function PropertyMap({
  detail,
  detailError,
  id,
  title = "Property map",
}: {
  detail: SiteDetailResponse | null;
  detailError: string | null;
  id?: string;
  /** Eyebrow label — e.g. "Comparable sales" when reused as a Cluster 2 CMA map. */
  title?: string;
}) {
  const ra = detail?.resolved_address;
  const hasCoords = !!ra && Number.isFinite(ra.latitude) && Number.isFinite(ra.longitude);

  if (!detail || !hasCoords) {
    return (
      <section id={id} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <span style={panelTitle}>{title}</span>
        <div
          style={{
            height: 440,
            border: "1px solid var(--border)",
            borderRadius: "20px",
            background: "var(--pale-wash)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
            {detailError ? `Map data unavailable: ${detailError}` : "Loading map…"}
          </p>
        </div>
      </section>
    );
  }

  const center: [number, number] = [ra!.longitude, ra!.latitude];
  const markers: MapMarker[] = [];
  const legend: MapLegendItem[] = [];
  const polygons: MapPolygonLayer[] = [];

  // Subject — the geocoded point, annotated with its own flood status.
  const flood = detail.flood?.data;
  const floodLine = flood
    ? `Flood zone ${flood.flood_zone ?? "—"}${flood.in_special_flood_hazard_area ? " (SFHA)" : ""}`
    : null;
  markers.push({
    id: "subject",
    lon: ra!.longitude,
    lat: ra!.latitude,
    kind: "subject",
    provenance: "live",
    frame: true,
    title: [ra!.normalized, floodLine].filter(Boolean).join("\n"),
  });
  legend.push({ label: "Subject property", provenance: "live", kind: "subject" });

  // Flood-hazard polygons.
  const fz = detail.flood_zones;
  if (fz?.data && fz.data.zones.length > 0) {
    polygons.push({
      id: "flood",
      kind: "flood",
      provenance: fz.provenance,
      features: fz.data.zones.map((z) => ({ sfha: z.sfha, geometry: z.geometry })),
    });
    // Split the flood legend by level — SFHA (1%-annual) vs 0.2%-annual — each
    // in its own hue, so the two risk levels read distinctly.
    const sfhaCount = fz.data.zones.filter((z) => z.sfha).length;
    const shadedCount = fz.data.zones.length - sfhaCount;
    if (sfhaCount > 0)
      legend.push({ label: "Flood: SFHA (1% annual)", provenance: fz.provenance, count: sfhaCount, kind: "flood", accent: FLOOD_SFHA_FILL });
    if (shadedCount > 0)
      legend.push({ label: "Flood: 0.2% annual", provenance: fz.provenance, count: shadedCount, kind: "flood", accent: FLOOD_SHADED_FILL });
  }

  // EPA cleanup sites — Superfund red, brownfield amber. Sites come from a wide
  // (radius_mi) net, so only the NEAR ones frame the view; distant sites still
  // render and stay in the count, but don't zoom the property out of sight. The
  // count is labeled as a radius tally so "16" never looks like an on-screen number.
  const contam = detail.contamination;
  const sites = contam?.data?.sites ?? [];
  const radius = contam?.data?.radius_mi ?? 2;
  if (sites.length > 0) {
    for (const s of sites) {
      const isSuperfund = /superfund|sems/i.test(s.program);
      markers.push({
        id: `site-${s.latitude},${s.longitude}-${s.name ?? "site"}`,
        lon: s.longitude,
        lat: s.latitude,
        kind: "hazard",
        provenance: contam!.provenance,
        frame: s.distance_mi <= 0.6, // nearby sites help frame; far ones don't
        accent: isSuperfund ? SUPERFUND_RED : BROWNFIELD_AMBER,
        title: [s.name ?? "Cleanup site", `${s.program} · ${s.distance_mi} mi`].join("\n"),
      });
    }
    legend.push({
      label: "EPA cleanup sites",
      provenance: contam!.provenance,
      kind: "hazard",
      detail: `${sites.length} within ${radius} mi`,
      inViewKind: "hazard", // map appends "· N in view" so number and picture agree
    });
  }

  // Comparable sales — colored by $/sqft on a diverging scale against the
  // subject's indicative value (the median comp psf, which the AVM uses). The
  // color turns "ten sales" into "where this property sits in its market".
  const compsData = detail.mls_comps?.data;
  const comps = compsData?.comps ?? [];
  const mappableComps = comps.filter(
    (c) => c.latitude != null && c.longitude != null && Number.isFinite(c.latitude) && Number.isFinite(c.longitude),
  );
  if (mappableComps.length > 0) {
    const compProv = detail.mls_comps!.provenance;
    const psfs = mappableComps.map((c) => c.price_per_sqft);
    const indicative = compsData!.median_price_per_sqft || psfs[Math.floor(psfs.length / 2)];
    const lo = Math.min(...psfs);
    const hi = Math.max(...psfs);
    for (const c of mappableComps) {
      markers.push({
        id: `comp-${c.latitude},${c.longitude}-${c.sale_date}-${c.sale_price}`,
        lon: c.longitude as number,
        lat: c.latitude as number,
        kind: "comp",
        provenance: compProv,
        frame: true,
        accent: compDivergingColor(c.price_per_sqft, indicative, lo, hi),
        title: [
          c.address,
          `${money(c.price_per_sqft)}/sf · ${c.sale_date}${c.distance_mi != null ? ` · ${c.distance_mi} mi` : ""}`,
        ].join("\n"),
      });
    }
    legend.push({
      label: "Comparable sales",
      provenance: compProv,
      count: mappableComps.length,
      kind: "comp",
      gradient: {
        // Unit lives on the scale itself, not only in the row label.
        css: COMP_GRADIENT_CSS,
        lowLabel: `${money(lo)}/sf`,
        midLabel: `${money(indicative)} indic.`,
        highLabel: `${money(hi)}/sf`,
      },
    });
  }

  return (
    <section id={id} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <span style={panelTitle}>{title}</span>
      <KoanoMap
        center={center}
        markers={markers}
        polygons={polygons}
        legend={legend}
        note={fz?.data && fz.data.zones.length > 0 ? "FEMA NFHL · minimal-hazard areas omitted" : undefined}
      />
    </section>
  );
}
