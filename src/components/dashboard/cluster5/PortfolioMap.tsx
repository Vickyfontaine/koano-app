"use client";

// PortfolioMap — Cluster 5 geographic risk map. Every tracked holding is a pin
// colored by its latest verdict's risk_score (green→amber→red, the same 3-bucket
// scale as the RiskMonitor table). It replaces the decorative neural-map hero
// with the one view an institutional user actually needs: where the portfolio
// sits and where the risk concentrates.
//
// Location-confidence is first-class here. A holding whose coordinates were
// resolved WITHOUT a cross-check (location_confidence !== "confirmed") renders as
// a dashed, hollow pin and is called out — a portfolio pin in the wrong place is
// the same failure as the 175-3rd-St mis-resolution, at portfolio scale. A
// holding with no stored coordinates at all is never guessed onto the map; it is
// listed below as un-mappable.

import React from "react";
import KoanoMap, { type MapLegendItem, type MapMarker } from "@/components/ui/map/KoanoMap";
import { riskPinColor, RISK_LOW, RISK_MID, RISK_HIGH, RISK_UNKNOWN } from "@/components/ui/map/mapColors";
import type { PortfolioProperty } from "@/app/api/properties/route";

const NYC_DEFAULT_CENTER: [number, number] = [-73.95, 40.7]; // fallback if nothing frames

function hasCoords(p: PortfolioProperty): boolean {
  return (
    typeof p.latitude === "number" &&
    typeof p.longitude === "number" &&
    Number.isFinite(p.latitude) &&
    Number.isFinite(p.longitude)
  );
}

function shellStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: "20px",
    background: "var(--white)",
    minHeight: "360px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    textAlign: "center",
  };
}

export default function PortfolioMap({
  properties,
  loadError,
}: {
  properties: PortfolioProperty[] | null;
  loadError?: string | null;
}) {
  if (loadError) {
    return (
      <div style={shellStyle()}>
        <p style={{ fontSize: "14px", color: "var(--ink-secondary)", margin: 0, maxWidth: "440px" }}>
          Could not load the portfolio map: {loadError}
        </p>
      </div>
    );
  }
  if (!properties) {
    return (
      <div style={shellStyle()}>
        <p style={{ fontSize: "13px", color: "var(--ink-faint)", margin: 0 }}>Loading portfolio map…</p>
      </div>
    );
  }

  const pinnable = properties.filter(hasCoords);
  const unpinnable = properties.filter((p) => !hasCoords(p));

  if (pinnable.length === 0) {
    return (
      <div style={shellStyle()}>
        <p style={{ fontSize: "14px", color: "var(--ink-secondary)", margin: 0, maxWidth: "460px", lineHeight: 1.55 }}>
          No mapped holdings yet. Add a NYC property to the portfolio below and it appears here,
          pinned and colored by its risk verdict.
        </p>
      </div>
    );
  }

  const markers: MapMarker[] = pinnable.map((p) => {
    const v = p.latest_verdict;
    const risk = v?.risk_score ?? null;
    // "confirmed" is the only value we trust for a confident pin; "unconfirmed"
    // and legacy null (pre-migration-017) both flag as location-unverified.
    const uncertain = p.location_confidence !== "confirmed";
    const label = p.address_normalized ?? p.address_input;
    const titleLines = [
      label,
      v ? `${v.verdict.toUpperCase()} · risk ${v.risk_score}/100 · conf ${v.confidence}` : "Not analyzed yet",
      uncertain ? "Location unverified — resolved without a cross-check" : "",
    ].filter(Boolean);
    return {
      id: p.id,
      lon: p.longitude as number,
      lat: p.latitude as number,
      kind: "holding",
      provenance: v?.overall_provenance ?? "live",
      accent: riskPinColor(risk),
      uncertain,
      frame: true,
      title: titleLines.join("\n"),
    };
  });

  const center: [number, number] =
    pinnable.length > 0
      ? [
          pinnable.reduce((s, p) => s + (p.longitude as number), 0) / pinnable.length,
          pinnable.reduce((s, p) => s + (p.latitude as number), 0) / pinnable.length,
        ]
      : NYC_DEFAULT_CENTER;

  const anyUnknown = pinnable.some((p) => p.latest_verdict == null);
  const anyUncertain = pinnable.some((p) => p.location_confidence !== "confirmed");

  // The risk buckets are a color KEY, not a data layer — suppress the provenance
  // dot on those rows (hideProvenanceDot).
  const legend: MapLegendItem[] = [
    { label: "High risk (≥ 67)", kind: "holding", provenance: "live", accent: RISK_HIGH, hideProvenanceDot: true },
    { label: "Elevated (34–66)", kind: "holding", provenance: "live", accent: RISK_MID, hideProvenanceDot: true },
    { label: "Low risk (< 34)", kind: "holding", provenance: "live", accent: RISK_LOW, hideProvenanceDot: true },
  ];
  if (anyUnknown)
    legend.push({ label: "Not analyzed", kind: "holding", provenance: "live", accent: RISK_UNKNOWN, hideProvenanceDot: true });
  if (anyUncertain)
    legend.push({
      label: "Location unverified",
      kind: "holding",
      provenance: "live",
      accent: RISK_UNKNOWN,
      uncertain: true,
      hideProvenanceDot: true,
    });

  const note =
    `${pinnable.length} holding${pinnable.length === 1 ? "" : "s"} mapped, colored by risk verdict.` +
    (anyUncertain ? " Dashed pins have an unverified location." : "");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <KoanoMap center={center} markers={markers} legend={legend} height={520} note={note} />
      {unpinnable.length > 0 && (
        <div
          style={{
            border: "1px solid var(--border)",
            borderLeft: "3px solid var(--signal-warning)",
            borderRadius: "0 12px 12px 0",
            padding: "12px 16px",
          }}
        >
          <p style={{ fontSize: "13px", color: "var(--ink-secondary)", margin: "0 0 6px", fontWeight: 500 }}>
            {unpinnable.length} holding{unpinnable.length === 1 ? "" : "s"} not on the map — no stored coordinates.
          </p>
          <p style={{ fontSize: "12px", color: "var(--ink-muted)", margin: 0, lineHeight: 1.5 }}>
            {unpinnable.map((p) => p.address_normalized ?? p.address_input).join(" · ")}
          </p>
          <p style={{ fontSize: "11px", color: "var(--ink-faint)", margin: "6px 0 0" }}>
            KOANO will not guess a pin location. Re-add the property to capture its coordinates.
          </p>
        </div>
      )}
    </div>
  );
}
