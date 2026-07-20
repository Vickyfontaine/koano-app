"use client";

// OwnershipPanel — Cluster 1 registered owner + portfolio (live HPD records).
// Exact-entity matching only (v1): the portfolio count is a floor, and the
// caveat is always displayed. Ownership records, not harassment/eviction data.

import React from "react";
import { BlockError, PanelHeader, Row, fmtInt, panelStyle, panelTitle } from "../panels";
import type { SiteDetailBlock } from "@/app/api/site-detail/route";
import type { LandlordPortfolioSummary } from "../../../../lib/providers/types";

interface OwnershipPanelProps {
  portfolio?: SiteDetailBlock<LandlordPortfolioSummary>;
  error?: string | null;
  id?: string;
}

export default function OwnershipPanel({ portfolio, error, id }: OwnershipPanelProps) {
  if (!portfolio || !portfolio.data) {
    return <BlockError title="Registered ownership" error={error ?? portfolio?.error} />;
  }
  const p = portfolio.data;

  return (
    <div style={panelStyle} id={id}>
      <PanelHeader title="Registered ownership" provenance={portfolio.provenance} />

      {p.hpd_registered ? (
        <>
          <Row label="Registered owner (HPD)" value={p.registered_owner ?? "—"} />
          {p.management_company && <Row label="Managing agent" value={p.management_company} />}
          <Row
            label="Buildings under this entity (exact match — a floor)"
            value={`${fmtInt(p.portfolio_building_count)}${p.portfolio_truncated ? "+" : ""}`}
          />
          <Row
            label="Portfolio HPD violations (open / total)"
            value={`${fmtInt(p.portfolio_open_hpd_violations)} / ${fmtInt(p.portfolio_total_hpd_violations)}`}
          />
        </>
      ) : (
        <p style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--ink-muted)", margin: 0 }}>
          No HPD registration — registered-owner records only exist for multiple dwellings
          (3 or more rental units).
        </p>
      )}

      <Row
        label="NYC Speculation Watch List"
        value={
          <span
            style={{
              color: p.on_speculation_watch_list ? "var(--signal-negative)" : "var(--ink-primary)",
              fontWeight: p.on_speculation_watch_list ? 500 : 400,
            }}
          >
            {p.on_speculation_watch_list ? "Listed" : "Not listed"}
          </span>
        }
      />

      {p.buildings.length > 1 && (
        <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "12px" }}>
          <div style={{ ...panelTitle, marginBottom: "8px" }}>Same-entity buildings</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {p.buildings.slice(0, 6).map((b) => (
              <div key={b.bbl} style={{ display: "flex", justifyContent: "space-between", gap: "10px", fontSize: "12px", color: "var(--ink-secondary)" }}>
                <span>{b.address}{b.zip ? `, ${b.zip}` : ""}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", color: "var(--ink-faint)" }}>
                  {b.open_hpd_violations} open
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={{ fontSize: "11px", color: "var(--ink-faint)", margin: 0 }}>{p.match_caveat}</p>
    </div>
  );
}
