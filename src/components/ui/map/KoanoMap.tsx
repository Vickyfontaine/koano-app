"use client";

// KoanoMap — the shared map primitive. An analytical instrument, not a consumer
// map: a near-monochrome base with decorative labels stripped, one deliberate
// marker shape per meaning (no default pins), and provenance carried ONTO the
// canvas — representative features render hollow/amber/dashed, and an in-map
// legend badges each layer live/representative. Every element carries meaning.
//
// Mapbox GL is dynamically imported inside an effect so it never evaluates
// during SSR (it touches `window` at module load). With no token, the component
// degrades to an honest bordered notice rather than breaking the page.

import "mapbox-gl/dist/mapbox-gl.css";
import React, { useEffect, useRef, useState } from "react";
import type {
  Map as MapboxMap,
  Marker as MapboxMarker,
  Popup as MapboxPopup,
} from "mapbox-gl";
import type { Provenance } from "../verdict";
import {
  BASE_GREEN,
  BASE_GREEN_CLASSES,
  BASE_WATER,
  BASE_WATERWAY,
  FLOOD_SFHA_FILL,
  FLOOD_SFHA_LINE,
  FLOOD_SHADED_FILL,
  FLOOD_SHADED_LINE,
  OZ_FILL,
  OZ_LINE,
  LOT_FILL,
  LOT_LINE,
} from "./mapColors";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export type MarkerKind = "subject" | "hazard" | "comp" | "holding";

export interface MapMarker {
  id: string;
  lon: number;
  lat: number;
  kind: MarkerKind;
  provenance: Provenance;
  /** Overrides the per-kind accent (e.g. Superfund red vs brownfield amber). */
  accent?: string;
  /** Hover tooltip content (plain text lines joined with \n). */
  title?: string;
  /**
   * Include this marker when auto-framing the view. Hazards are gathered from a
   * wide radius and would blow out the zoom, so a property map frames to the
   * subject + comps and lets distant hazards fall off-frame (still legend-counted).
   * When no marker sets it, the map frames to all markers.
   */
  frame?: boolean;
  /**
   * Coordinate confidence is degraded — the marker renders hollow + dashed so a
   * pin whose location was resolved without a cross-check never reads as a
   * confident dot (a portfolio pin in the wrong place is a real failure).
   */
  uncertain?: boolean;
}

interface PolyGeometry {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
}
export interface MapPolygonLayer {
  id: string;
  kind: "flood" | "oz" | "lot";
  provenance: Provenance;
  /** flood features carry { sfha: boolean } for styling weight; oz/lot ignore it. */
  features: Array<{ sfha?: boolean; geometry: PolyGeometry }>;
}

/** A diverging color scale decoded in the legend (e.g. comps by $/sqft). */
export interface MapLegendGradient {
  css: string; // the gradient bar background
  lowLabel: string;
  midLabel: string;
  highLabel: string;
}

export interface MapLegendItem {
  label: string;
  provenance: Provenance;
  count?: number;
  /** A swatch hint: which marker/polygon language this row refers to. */
  kind: MarkerKind | "flood";
  /** Swatch color override (e.g. an SFHA vs 0.2% flood level). */
  accent?: string;
  /** When present, the row renders a diverging scale bar instead of a glyph. */
  gradient?: MapLegendGradient;
  /** A static detail (e.g. "16 within 2 mi") shown under the label. */
  detail?: string;
  /** When set, the map appends a live "· N in view" count of this marker kind,
   *  recomputed as the viewport changes — so the number matches the picture. */
  inViewKind?: MarkerKind;
  /** Render the glyph in its uncertain (dashed/hollow) form — e.g. the
   *  "location unverified" holding legend row. */
  uncertain?: boolean;
  /** Suppress the trailing provenance dot. A risk-bucket row is a color KEY
   *  (color→meaning), not a data layer, so a "live" dot on it would mislead. */
  hideProvenanceDot?: boolean;
}

interface KoanoMapProps {
  center: [number, number]; // [lon, lat] — the subject
  markers: MapMarker[];
  polygons?: MapPolygonLayer[];
  legend: MapLegendItem[];
  height?: number;
  /** Short caption under the legend (e.g. the flood scope note). */
  note?: string;
}

// --- deliberate marker language (crisp inline SVG, no default pins) -----------

const NAVY = "#1A4F6E";
const INK_MUTED = "#5A7A8C";

function markerSvg(kind: MarkerKind, provenance: Provenance, accent?: string, uncertain = false): string {
  const rep = provenance === "representative";
  const dash = rep ? ` stroke-dasharray="3 2"` : "";
  if (kind === "holding") {
    // A portfolio holding, colored by risk (accent). Uncertain location → hollow,
    // dashed accent ring + a dashed amber outer ring, so a pin whose coordinates
    // were resolved without a cross-check never reads as a confident dot.
    const c = accent ?? INK_MUTED;
    if (uncertain) {
      return `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="8" fill="none" stroke="#F59E0B" stroke-width="1.25" stroke-dasharray="2 2"/>
        <circle cx="10" cy="10" r="5" fill="#FFFFFF" stroke="${c}" stroke-width="1.75" stroke-dasharray="2.5 2"/>
      </svg>`;
    }
    return `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6" fill="${c}" stroke="#FFFFFF" stroke-width="2"/>
    </svg>`;
  }
  if (kind === "subject") {
    // The anchor — the one thing the page is about. Its own language: a solid
    // navy roundel with a white keyline and a soft halo, plus locating ticks.
    // Heavy and unmistakable, never a lighter comp dot.
    const c = NAVY;
    return `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="16" fill="${c}" opacity="0.13"/>
      <line x1="20" y1="2" x2="20" y2="8" stroke="${c}" stroke-width="2"/>
      <line x1="20" y1="32" x2="20" y2="38" stroke="${c}" stroke-width="2"/>
      <line x1="2" y1="20" x2="8" y2="20" stroke="${c}" stroke-width="2"/>
      <line x1="32" y1="20" x2="38" y2="20" stroke="${c}" stroke-width="2"/>
      <circle cx="20" cy="20" r="8.5" fill="${c}" stroke="#FFFFFF" stroke-width="2.5"${dash}/>
      <circle cx="20" cy="20" r="2.6" fill="#FFFFFF"/>
    </svg>`;
  }
  if (kind === "hazard") {
    // A diamond = hazard. Filled when live; hollow when representative.
    const c = accent ?? "#EF4444";
    const fill = rep ? "#FFFFFF" : c;
    return `<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <rect x="4.2" y="4.2" width="9.6" height="9.6" transform="rotate(45 9 9)" fill="${fill}" stroke="${c}" stroke-width="1.5"${dash}/>
    </svg>`;
  }
  // comp — a node colored by $/sqft (its accent). The color is the information;
  // shape and size stay modest so the subject remains the focal point.
  const c = accent ?? INK_MUTED;
  const fill = rep ? "#FFFFFF" : c;
  return `<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="5" fill="${fill}" stroke="rgba(13,43,62,0.35)" stroke-width="1"${dash}/>
  </svg>`;
}

function provDotColor(p: Provenance): string {
  return p === "live" ? "var(--signal-positive)" : p === "representative" ? "var(--signal-warning)" : "var(--ink-faint)";
}

function legendGlyph(
  kind: MarkerKind | "flood",
  provenance: Provenance,
  accent?: string,
  uncertain = false,
): React.ReactNode {
  const rep = provenance === "representative";
  const common: React.CSSProperties = { flexShrink: 0 };
  if (kind === "holding") {
    const c = accent ?? INK_MUTED;
    return uncertain ? (
      <span
        style={{ ...common, width: 12, height: 12, borderRadius: "50%", background: "#FFF", border: `1.5px dashed ${c}`, boxShadow: "0 0 0 1.5px #F59E0B" }}
      />
    ) : (
      <span style={{ ...common, width: 12, height: 12, borderRadius: "50%", background: c, border: "2px solid #FFF", boxShadow: `0 0 0 1px ${c}` }} />
    );
  }
  if (kind === "subject")
    return (
      <span
        style={{
          ...common,
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: NAVY,
          border: "2px solid #FFFFFF",
          boxShadow: `0 0 0 1px ${NAVY}`,
        }}
      />
    );
  if (kind === "hazard")
    return (
      <span
        style={{
          ...common,
          width: 10,
          height: 10,
          transform: "rotate(45deg)",
          background: rep ? "#FFF" : accent ?? "#EF4444",
          border: `1.5px solid ${accent ?? "#EF4444"}`,
        }}
      />
    );
  if (kind === "flood") {
    const fill = accent ?? FLOOD_SFHA_FILL;
    return <span style={{ ...common, width: 14, height: 10, background: fill, opacity: 0.5, border: `1px solid ${fill}` }} />;
  }
  // comp
  return (
    <span
      style={{ ...common, width: 10, height: 10, borderRadius: "50%", background: rep ? "#FFF" : accent ?? INK_MUTED, border: `1.5px solid rgba(13,43,62,0.35)` }}
    />
  );
}

export default function KoanoMap({ center, markers, polygons = [], legend, height = 440, note }: KoanoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markerObjs = useRef<MapboxMarker[]>([]);
  const popupRef = useRef<MapboxPopup | null>(null);
  const moveHandlerRef = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [inView, setInView] = useState<Partial<Record<MarkerKind, number>>>({});

  const signature = JSON.stringify({ center, markers, polygons });

  // Create the map once.
  useEffect(() => {
    if (!TOKEN || !containerRef.current) return;
    let cancelled = false;
    let map: MapboxMap | null = null;
    (async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        mapboxgl.accessToken = TOKEN;
        if (cancelled || !containerRef.current) return;
        map = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/light-v11",
          center,
          zoom: 14,
          attributionControl: true,
          cooperativeGestures: true,
        });
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
        popupRef.current = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 12, className: "koano-map-popup" });
        map.on("load", () => {
          // Strip decorative labels — keep only what aids orientation.
          try {
            for (const layer of map!.getStyle().layers ?? []) {
              if (/poi|transit|natural-point|water-point-label/.test(layer.id)) {
                map!.setLayoutProperty(layer.id, "visibility", "none");
              }
            }
          } catch {
            /* style layer ids vary across versions — non-fatal */
          }
          // Restrained geographic color on the base: water a soft blue-grey,
          // parks a muted sage — real features, still subordinate to the data
          // layers. Each guarded: light-v11 layer ids can change.
          const paint = (fn: () => void) => {
            try {
              fn();
            } catch {
              /* layer absent in this style version — non-fatal */
            }
          };
          paint(() => map!.setPaintProperty("water", "fill-color", BASE_WATER));
          paint(() => map!.setPaintProperty("waterway", "line-color", BASE_WATERWAY));
          paint(() => map!.setPaintProperty("national-park", "fill-color", BASE_GREEN));
          paint(() => map!.setPaintProperty("national-park", "fill-opacity", 0.5));
          paint(() =>
            map!.setPaintProperty("landuse", "fill-color", [
              "match",
              ["get", "class"],
              BASE_GREEN_CLASSES,
              BASE_GREEN,
              "rgba(0,0,0,0)",
            ] as unknown as string),
          );
          paint(() => map!.setPaintProperty("landuse", "fill-opacity", 0.6));
          if (!cancelled) setReady(true);
        });
        // Log runtime errors (a tile 404, a transient) but do NOT hide a working
        // map — only a construction failure or a missing token shows the fallback.
        map.on("error", (e: { error?: { message?: string } }) =>
          console.warn("[KoanoMap]", e?.error?.message ?? "map error"),
        );
        mapRef.current = map;
      } catch {
        setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      markerObjs.current.forEach((m) => m.remove());
      markerObjs.current = [];
      popupRef.current?.remove();
      map?.remove();
      mapRef.current = null;
    };
    // center is captured at init; data updates handled in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (Re)draw markers + polygons whenever the data changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    // Clear previous markers + our sources/layers.
    markerObjs.current.forEach((m) => m.remove());
    markerObjs.current = [];
    for (const p of polygons) {
      for (const suffix of ["-fill", "-shaded", "-line"]) {
        const id = p.id + suffix;
        if (map.getLayer(id)) map.removeLayer(id);
      }
      if (map.getSource(p.id)) map.removeSource(p.id);
    }

    let mapboxgl: typeof import("mapbox-gl").default | null = null;
    (async () => {
      mapboxgl = (await import("mapbox-gl")).default;

      // Polygon layers by kind: flood (SFHA/0.2%), OZ tract shading (gold), and
      // the subject lot footprint (navy outline). Drawn before markers so pins sit
      // on top. OZ under lot so the lot outline stays legible over the shading.
      const drawOrder = { oz: 0, flood: 1, lot: 2 } as const;
      for (const layer of [...polygons].sort((a, b) => drawOrder[a.kind] - drawOrder[b.kind])) {
        if (layer.features.length === 0) continue;
        const fc = {
          type: "FeatureCollection" as const,
          features: layer.features.map((f) => ({
            type: "Feature" as const,
            properties: { sfha: !!f.sfha },
            geometry: f.geometry,
          })),
        };
        map.addSource(layer.id, { type: "geojson", data: fc as unknown as GeoJSON.FeatureCollection });
        const rep = layer.provenance === "representative";

        if (layer.kind === "flood") {
          // SFHA (1%-annual) blue and 0.2%-annual teal differ by hue, not just
          // opacity, so a serious boundary reads distinctly from the lighter one.
          map.addLayer({ id: layer.id + "-fill", type: "fill", source: layer.id, filter: ["==", ["get", "sfha"], true], paint: { "fill-color": FLOOD_SFHA_FILL, "fill-opacity": rep ? 0.12 : 0.3 } });
          map.addLayer({ id: layer.id + "-shaded", type: "fill", source: layer.id, filter: ["==", ["get", "sfha"], false], paint: { "fill-color": FLOOD_SHADED_FILL, "fill-opacity": rep ? 0.1 : 0.26 } });
          map.addLayer({ id: layer.id + "-line", type: "line", source: layer.id, paint: { "line-color": ["case", ["==", ["get", "sfha"], true], FLOOD_SFHA_LINE, FLOOD_SHADED_LINE], "line-width": 1.2, "line-opacity": 0.75, ...(rep ? { "line-dasharray": [2, 2] } : {}) } });
        } else if (layer.kind === "oz") {
          // Opportunity Zone tract — pale gold fill, gold edge.
          map.addLayer({ id: layer.id + "-fill", type: "fill", source: layer.id, paint: { "fill-color": OZ_FILL, "fill-opacity": 0.4 } });
          map.addLayer({ id: layer.id + "-line", type: "line", source: layer.id, paint: { "line-color": OZ_LINE, "line-width": 1, "line-opacity": 0.7, "line-dasharray": [3, 2] } });
        } else {
          // Subject lot footprint — faint navy fill, strong navy outline.
          map.addLayer({ id: layer.id + "-fill", type: "fill", source: layer.id, paint: { "fill-color": LOT_FILL, "fill-opacity": 1 } });
          map.addLayer({ id: layer.id + "-line", type: "line", source: layer.id, paint: { "line-color": LOT_LINE, "line-width": 2, "line-opacity": 0.9 } });
        }
      }

      // Markers, drawn subject-last so it sits on top.
      const ordered = [...markers].sort((a, b) => (a.kind === "subject" ? 1 : 0) - (b.kind === "subject" ? 1 : 0));
      for (const mk of ordered) {
        const el = document.createElement("div");
        el.style.cursor = "default";
        // A white halo so any mark reads on the pale base and the flood fills.
        el.style.filter = "drop-shadow(0 0 1px #fff) drop-shadow(0 0 1px #fff)";
        el.innerHTML = markerSvg(mk.kind, mk.provenance, mk.accent, mk.uncertain);
        if (mk.title) {
          el.addEventListener("mouseenter", () => {
            if (!popupRef.current) return;
            popupRef.current
              .setLngLat([mk.lon, mk.lat])
              .setHTML(
                `<div style="font-family:'DM Mono',monospace;font-size:11px;line-height:1.5;color:#0D2B3E">${mk.title!
                  .split("\n")
                  .map((l) => l.replace(/</g, "&lt;"))
                  .join("<br/>")}</div>`,
              )
              .addTo(map);
          });
          el.addEventListener("mouseleave", () => popupRef.current?.remove());
        }
        const marker = new mapboxgl!.Marker({ element: el }).setLngLat([mk.lon, mk.lat]).addTo(map);
        markerObjs.current.push(marker);
      }

      // Frame to the framing markers (subject + comps) — not the polygons (a
      // flood zone can span the whole view) and not the wide hazard net (which
      // would zoom the property out of sight). Fall back to all markers if none
      // opted into framing.
      const finite = (m: MapMarker) => Number.isFinite(m.lon) && Number.isFinite(m.lat);
      const framed = markers.filter((m) => m.frame && finite(m));
      const pts = framed.length >= 1 ? framed : markers.filter(finite);
      if (pts.length >= 2) {
        const b = new mapboxgl!.LngLatBounds();
        pts.forEach((m) => b.extend([m.lon, m.lat]));
        map.fitBounds(b, { padding: 64, maxZoom: 16, duration: 0 });
      } else {
        map.setCenter(center);
        map.setZoom(14);
      }

      // Live "in view" counts per marker kind, so a legend that shows a radius
      // tally can also say how many are actually on screen — and stay correct as
      // the user pans/zooms.
      const recompute = () => {
        // Project each marker to a screen pixel and test against the actual
        // canvas — robust to the camera padding fitBounds leaves set (getBounds()
        // returns the padding-inset region and would miss edge markers).
        const container = map.getContainer();
        const w = container.clientWidth;
        const h = container.clientHeight;
        const counts: Partial<Record<MarkerKind, number>> = {};
        for (const mk of markers) {
          if (!finite(mk)) continue;
          const p = map.project([mk.lon, mk.lat]);
          if (p.x >= 0 && p.x <= w && p.y >= 0 && p.y <= h) {
            counts[mk.kind] = (counts[mk.kind] ?? 0) + 1;
          }
        }
        setInView(counts);
      };
      // Recompute on both moveend (responsive during a pan) and idle (fires
      // after fitBounds + tiles settle — a `once` here would freeze the count at
      // the pre-fit state). Idempotent, so multiple runs just converge.
      if (moveHandlerRef.current) {
        map.off("moveend", moveHandlerRef.current);
        map.off("idle", moveHandlerRef.current);
      }
      moveHandlerRef.current = recompute;
      map.on("moveend", recompute);
      map.on("idle", recompute);
      recompute();
    })();
    return () => {
      const map = mapRef.current;
      if (map && moveHandlerRef.current) {
        map.off("moveend", moveHandlerRef.current);
        map.off("idle", moveHandlerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, signature]);

  if (!TOKEN || failed) {
    return (
      <div
        style={{
          height,
          border: "1px solid var(--border)",
          borderRadius: "20px",
          background: "var(--pale-wash)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", maxWidth: "360px", margin: 0 }}>
          {failed ? "Map failed to load." : "Map needs a Mapbox token."}{" "}
          {!TOKEN && (
            <>
              Set <code style={{ fontFamily: "'DM Mono', monospace" }}>NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> in{" "}
              <code style={{ fontFamily: "'DM Mono', monospace" }}>.env.local</code>.
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", borderRadius: "20px", overflow: "hidden", border: "1px solid var(--border)" }}>
      <div ref={containerRef} style={{ height, width: "100%" }} />
      {/* In-map legend — provenance lives ON the canvas, not in a caption elsewhere. */}
      <div
        style={{
          position: "absolute",
          top: "14px",
          left: "14px",
          background: "rgba(255,255,255,0.94)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "12px 14px",
          maxWidth: "260px",
          backdropFilter: "blur(4px)",
        }}
      >
        {/* Header — collapsible so it never has to occlude the thing the map is
            about (the flood boundary can run right under this corner). */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            width: "100%",
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            fontFamily: "'DM Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--ink-faint)",
            marginBottom: collapsed ? 0 : "10px",
          }}
        >
          <span>Layers</span>
          <span aria-hidden="true" style={{ fontSize: "11px", lineHeight: 1 }}>{collapsed ? "+" : "–"}</span>
        </button>

        {!collapsed && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              {legend.map((item) => {
                const provDot = item.hideProvenanceDot ? null : (
                  <span
                    title={item.provenance}
                    style={{ width: "7px", height: "7px", borderRadius: "50%", background: provDotColor(item.provenance), flexShrink: 0 }}
                  />
                );
                const detailText =
                  item.detail || item.inViewKind
                    ? `${item.detail ?? ""}${
                        item.inViewKind ? `${item.detail ? " · " : ""}${inView[item.inViewKind] ?? 0} in view` : ""
                      }`
                    : null;
                const labelText = (
                  <span style={{ fontSize: "12px", color: "var(--ink-secondary)", flex: 1 }}>
                    {item.label}
                    {typeof item.count === "number" && <span style={{ color: "var(--ink-faint)" }}> · {item.count}</span>}
                  </span>
                );
                if (item.gradient) {
                  // A diverging scale decoded on the map: the bar + its value anchors.
                  return (
                    <div key={item.label} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {labelText}
                        {provDot}
                      </div>
                      <div
                        style={{
                          height: "8px",
                          borderRadius: "2px",
                          background: item.gradient.css,
                          border: "1px solid rgba(13,43,62,0.15)",
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontFamily: "'DM Mono', monospace",
                          fontSize: "9px",
                          color: "var(--ink-faint)",
                        }}
                      >
                        <span>{item.gradient.lowLabel}</span>
                        <span>{item.gradient.midLabel}</span>
                        <span>{item.gradient.highLabel}</span>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={item.label} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ display: "inline-flex", width: "16px", justifyContent: "center" }}>
                        {legendGlyph(item.kind, item.provenance, item.accent, item.uncertain)}
                      </span>
                      {labelText}
                      {provDot}
                    </div>
                    {detailText && (
                      <span
                        style={{
                          paddingLeft: "24px",
                          fontFamily: "'DM Mono', monospace",
                          fontSize: "9px",
                          color: "var(--ink-faint)",
                        }}
                      >
                        {detailText}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {note && (
              <p style={{ fontSize: "10px", lineHeight: 1.45, color: "var(--ink-faint)", margin: "9px 0 0" }}>{note}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
