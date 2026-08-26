"use client";

// PricingPanel — Cluster 2 pricing recommendation (Checkpoint 4).
// The suggested list range is deterministic, transparent math over the comp
// benchmark (representative — badged, never implied live) with the banding
// rule shown. The KOANO verdict supplies timing context once the pipeline
// completes; the full reasoning chain renders below it on the page.

import React from "react";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import { VERDICT_COLORS, weakestProvenance, type SynthesisResult } from "@/components/ui/verdict";
import { BlockError, PanelHeader, Row, fmtInt, fmtMoney, panelStyle } from "../panels";
import type { SiteDetailResponse } from "@/app/api/site-detail/route";

interface PricingPanelProps {
  detail: SiteDetailResponse | null;
  detailError: string | null;
  verdict: SynthesisResult | null; // arrives when the pipeline completes
  id?: string;
}

export default function PricingPanel({ detail, detailError, verdict, id }: PricingPanelProps) {
  if (!detail) {
    return <BlockError title="Pricing recommendation" error={detailError ?? undefined} />;
  }

  const comps = detail.mls_comps;
  const zoning = detail.zoning;
  const psf = comps?.data?.median_price_per_sqft ?? null;
  const sqft = zoning?.data?.building_area_sqft ?? null;
  const trend = comps?.data?.price_trend ?? null;
  // A band needs a REAL $/sqft and a REAL area. psf === 0 is the "no comps"
  // signal (e.g. an out-of-coverage address) — it must NOT produce a "$0 – $0"
  // band a user could act on; fall through to the unavailable message instead.
  const base = psf != null && psf > 0 && sqft != null && sqft > 0 ? psf * sqft : null;

  // The band leans on BOTH the comp benchmark and the PLUTO area, so its
  // provenance is the weaker of the two — never just the comps'.
  const areaLive = zoning?.provenance === "live";
  const pricingProvenance = weakestProvenance(
    [comps, zoning].filter((b): b is NonNullable<typeof b> => !!b).map((b) => ({ provenance: b.provenance })),
  );

  // Transparent banding rule keyed to recorded-sale price movement: rising →
  // price toward the top of the band; falling → toward the bottom; flat →
  // symmetric. (Replaces the DOM-based rule; recorded sales have no DOM.)
  let low: number | null = null;
  let high: number | null = null;
  let bandNote = "";
  if (base != null) {
    if (trend === "rising") {
      low = base;
      high = base * 1.05;
      bandNote = "local prices rising → band set at benchmark to +5%";
    } else if (trend === "falling") {
      low = base * 0.95;
      high = base;
      bandNote = "local prices falling → band set at −5% to benchmark";
    } else {
      low = base * 0.975;
      high = base * 1.025;
      bandNote = "local prices flat → symmetric ±2.5% band";
    }
  }

  return (
    <div style={panelStyle} id={id}>
      <PanelHeader title="Pricing recommendation" provenance={pricingProvenance} />

      {base != null ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "26px",
                fontWeight: 500,
                color: "var(--ink-primary)",
              }}
            >
              {fmtMoney(Math.round(low!))} – {fmtMoney(Math.round(high!))}
            </span>
            {pricingProvenance && <ProvenanceBadge provenance={pricingProvenance} />}
          </div>
          <p style={{ fontSize: "12px", color: "var(--ink-muted)", margin: 0 }}>
            Benchmark {fmtMoney(psf)}/sq ft (median recorded sale) × {fmtInt(sqft)} sq ft
            building area ({areaLive ? "live PLUTO" : "non-live area"}) = {fmtMoney(Math.round(base))}; {bandNote}.
            {pricingProvenance !== "live" && (
              <> Not fully live — a fully live band needs live recorded sales and live PLUTO area.</>
            )}
          </p>
        </>
      ) : (
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
          Insufficient data for a price band (needs comp $/sq ft and building area).
        </p>
      )}

      <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {verdict ? (
          <>
            <Row
              label="KOANO timing verdict"
              value={
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      textTransform: "uppercase",
                      fontWeight: 500,
                      color: VERDICT_COLORS[verdict.verdict],
                    }}
                  >
                    {verdict.verdict}
                  </span>
                  · conf {verdict.confidence} · {verdict.signal_window_months} mo window
                  <ProvenanceBadge provenance={verdict.overall_provenance} />
                </span>
              }
            />
            <p style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--ink-secondary)", margin: 0 }}>
              {verdict.headline}
            </p>
            <p style={{ fontSize: "11px", color: "var(--ink-faint)", margin: 0 }}>
              Full agent reasoning below. Decision support, not financial advice.
            </p>
          </>
        ) : (
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
            KOANO timing verdict pending. The five-agent pipeline is still running.
          </p>
        )}
      </div>
    </div>
  );
}
