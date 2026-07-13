"use client";

// PricingPanel — Cluster 2 pricing recommendation (Checkpoint 4).
// The suggested list range is deterministic, transparent math over the comp
// benchmark (representative — badged, never implied live) with the banding
// rule shown. The KOANO verdict supplies timing context once the pipeline
// completes; the full reasoning chain renders below it on the page.

import React from "react";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import { swapIntegrationFor, VERDICT_COLORS, type SynthesisResult } from "@/components/ui/verdict";
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
  const trend = comps?.data?.dom_trend ?? null;
  const base = psf != null && sqft != null && sqft > 0 ? psf * sqft : null;
  const mlsSwap = comps ? swapIntegrationFor([comps.source]) : null;

  // Transparent banding rule: DOM compressing → price toward the top of the
  // band; expanding → toward the bottom; flat → symmetric.
  let low: number | null = null;
  let high: number | null = null;
  let bandNote = "";
  if (base != null) {
    if (trend === "compressing") {
      low = base;
      high = base * 1.05;
      bandNote = "days-on-market compressing → band set at benchmark to +5%";
    } else if (trend === "expanding") {
      low = base * 0.95;
      high = base;
      bandNote = "days-on-market expanding → band set at −5% to benchmark";
    } else {
      low = base * 0.975;
      high = base * 1.025;
      bandNote = "days-on-market flat → symmetric ±2.5% band";
    }
  }

  return (
    <div style={panelStyle} id={id}>
      <PanelHeader
        title="Pricing recommendation"
        provenance={comps?.provenance}
        becomesLiveWith={mlsSwap}
      />

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
            {comps && <ProvenanceBadge provenance={comps.provenance} />}
          </div>
          <p style={{ fontSize: "12px", color: "var(--ink-muted)", margin: 0 }}>
            Benchmark {fmtMoney(psf)}/sq ft (median comp, indicative) × {fmtInt(sqft)} sq ft
            building area (live PLUTO) = {fmtMoney(Math.round(base))}; {bandNote}.
            {comps?.provenance !== "live" && (
              <> Representative benchmark — becomes live with {mlsSwap ?? "MLS"} integration.</>
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
            KOANO timing verdict pending — the five-agent pipeline is still running.
          </p>
        )}
      </div>
    </div>
  );
}
