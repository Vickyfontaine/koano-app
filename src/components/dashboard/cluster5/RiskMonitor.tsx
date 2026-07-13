"use client";

// RiskMonitor — Cluster 5 (Checkpoint 4).
// Per-property risk table: verdict risk score from the audit trail, live FEMA
// flood status, and premium hazard factors (representative until Verisk /
// First Street premium is funded — badged). Point-in-time fetches, refreshable.

import React, { useCallback, useEffect, useState } from "react";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import { swapIntegrationFor } from "@/components/ui/verdict";
import { PanelHeader, panelStyle, panelTitle, riskColor } from "../panels";
import type { PortfolioProperty } from "@/app/api/properties/route";
import type { SiteDetailResponse } from "@/app/api/site-detail/route";

interface RiskRow {
  property: PortfolioProperty;
  loading: boolean;
  detail: SiteDetailResponse | null;
  error: string | null;
}

const MAX_ROWS = 10;

interface RiskMonitorProps {
  properties: PortfolioProperty[] | null;
  id?: string;
}

export default function RiskMonitor({ properties, id }: RiskMonitorProps) {
  const [rows, setRows] = useState<RiskRow[]>([]);

  const load = useCallback(async () => {
    if (!properties || properties.length === 0) {
      setRows([]);
      return;
    }
    const targets = properties.slice(0, MAX_ROWS);
    setRows(targets.map((p) => ({ property: p, loading: true, detail: null, error: null })));
    await Promise.all(
      targets.map(async (p, i) => {
        try {
          const res = await fetch("/api/site-detail", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address: p.address_normalized ?? p.address_input,
              blocks: ["flood", "premium_hazard"],
            }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
          setRows((prev) =>
            prev.map((r, j) => (j === i ? { ...r, loading: false, detail: json } : r)),
          );
        } catch (e) {
          setRows((prev) =>
            prev.map((r, j) =>
              j === i
                ? { ...r, loading: false, error: e instanceof Error ? e.message : "fetch failed" }
                : r,
            ),
          );
        }
      }),
    );
  }, [properties]);

  useEffect(() => {
    void load();
  }, [load]);

  const hazardSwap = swapIntegrationFor(["KOANO representative hazard"]);

  return (
    <div style={panelStyle} id={id}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
        <PanelHeader title="Risk monitor" />
        <button
          onClick={() => void load()}
          style={{
            border: "1px solid var(--border)",
            background: "transparent",
            borderRadius: "100px",
            padding: "6px 14px",
            fontFamily: "inherit",
            fontSize: "12px",
            fontWeight: 500,
            color: "var(--ink-muted)",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      {(!properties || properties.length === 0) && (
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
          Track properties to monitor their risk.
        </p>
      )}

      {rows.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "640px" }}>
            <thead>
              <tr>
                {["Property", "Verdict risk", "FEMA flood", "Flood factor", "Fire factor", "30-yr flood prob."].map(
                  (h) => (
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
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const v = r.property.latest_verdict;
                const flood = r.detail?.flood;
                const hazard = r.detail?.premium_hazard;
                return (
                  <tr key={r.property.id}>
                    <td style={{ padding: "10px 12px", fontSize: "13px", color: "var(--ink-secondary)", borderBottom: "1px solid var(--border-light)" }}>
                      {r.property.address_normalized ?? r.property.address_input}
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "'DM Mono', monospace", fontSize: "13px", fontWeight: 500, color: v ? riskColor(v.risk_score) : "var(--ink-faint)", borderBottom: "1px solid var(--border-light)" }}>
                      {v ? `${v.risk_score}/100` : "not analyzed"}
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: "12px", borderBottom: "1px solid var(--border-light)" }}>
                      {r.loading ? (
                        <span style={{ color: "var(--ink-faint)" }}>fetching…</span>
                      ) : flood?.data ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--ink-secondary)" }}>
                          zone {flood.data.flood_zone ?? "—"}
                          {flood.data.in_special_flood_hazard_area ? " · SFHA" : ""}
                          <ProvenanceBadge provenance={flood.provenance} />
                        </span>
                      ) : (
                        <span style={{ color: "var(--ink-faint)" }}>{r.error ?? "—"}</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "var(--ink-primary)", borderBottom: "1px solid var(--border-light)" }}>
                      {hazard?.data ? `${hazard.data.flood_factor_1_to_10}/10` : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "var(--ink-primary)", borderBottom: "1px solid var(--border-light)" }}>
                      {hazard?.data ? `${hazard.data.fire_factor_1_to_10}/10` : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: "12px", borderBottom: "1px solid var(--border-light)" }}>
                      {hazard?.data ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "'DM Mono', monospace", color: "var(--ink-primary)" }}>
                          {hazard.data.thirty_yr_flood_probability_pct}%
                          <ProvenanceBadge provenance={hazard.provenance} />
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ fontSize: "11px", color: "var(--ink-faint)", margin: 0 }}>
        Hazard factors are representative — become live with {hazardSwap ?? "premium hazard"}{" "}
        integration. Point-in-time fetches; continuous monitoring is a funded-roadmap capability.
      </p>
    </div>
  );
}
