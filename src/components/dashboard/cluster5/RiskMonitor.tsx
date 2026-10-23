"use client";

// RiskMonitor — Cluster 5 (Checkpoint 4; Phase 1: live hazard).
// Per-property risk table: verdict risk score from the audit trail, live FEMA
// flood status, and live federal hazard signals — EPA Superfund/brownfield
// proximity, USGS seismic, and FEMA disaster history. Point-in-time fetches,
// refreshable.

import React, { useCallback, useEffect, useState } from "react";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import { PanelHeader, panelStyle, panelTitle, riskInk } from "../panels";
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
              blocks: ["flood", "contamination", "seismic", "disaster_history"],
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

  return (
    <div style={panelStyle} id={id}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
        <PanelHeader title="Risk monitor" />
        <button
          onClick={() => void load()}
          style={{
            border: "1px solid var(--border)",
            background: "transparent",
            borderRadius: "100px",
            padding: "8px 16px",
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
        <div className="phone-only" style={{ flexDirection: "column", gap: "var(--space-3)" }} role="list" aria-label="Hazard signals by holding">
          {rows.map((r) => {
            const v = r.property.latest_verdict;
            const flood = r.detail?.flood;
            const contamination = r.detail?.contamination;
            const seismic = r.detail?.seismic;
            const disaster = r.detail?.disaster_history;
            return (
              <div key={r.property.id} className="holding-card" role="listitem" aria-busy={r.loading}>
                <span className="card-title">{r.property.address_normalized ?? r.property.address_input}</span>
                <dl className="card-figures" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                  <div>
                    <dt>Verdict risk</dt>
                    <dd style={{ color: v ? riskInk(v.risk_score) : "var(--ink-muted)" }}>{v ? v.risk_score : "n/a"}</dd>
                  </div>
                  <div>
                    <dt>FEMA flood</dt>
                    <dd style={{ fontSize: "var(--text-ui)" }}>
                      {r.loading ? "…" : flood?.data ? `zone ${flood.data.flood_zone ?? "n/a"}${flood.data.in_special_flood_hazard_area ? " · SFHA" : ""}` : "n/a"}
                    </dd>
                  </div>
                  <div>
                    <dt>Superfund ≤2mi</dt>
                    <dd>{contamination?.data ? contamination.data.superfund_sites_within_radius : r.loading ? "…" : "n/a"}</dd>
                  </div>
                  <div>
                    <dt>Disasters 10yr</dt>
                    <dd>{disaster?.data ? disaster.data.declarations_last_10yr : r.loading ? "…" : "n/a"}</dd>
                  </div>
                </dl>
                <span className="card-note">
                  Seismic {seismic?.data && seismic.data.pga_g != null ? `${seismic.data.pga_g}g PGA` : "n/a"}
                  {r.error ? ` · ${r.error}` : ""}
                </span>
                {flood?.data && <ProvenanceBadge provenance={flood.provenance} />}
              </div>
            );
          })}
        </div>
      )}
      {rows.length > 0 && (
        <div className="scroll-x wide-only" style={{ overflowX: "auto", padding: "2px" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "640px" }}>
            <thead>
              <tr>
                {["Property", "Verdict risk", "FEMA flood", "Superfund ≤2mi", "Seismic (PGA)", "FEMA disasters 10yr"].map(
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
                const contamination = r.detail?.contamination;
                const seismic = r.detail?.seismic;
                const disaster = r.detail?.disaster_history;
                return (
                  <tr key={r.property.id}>
                    <td style={{ padding: "8px 12px", fontSize: "13px", color: "var(--ink-secondary)", borderBottom: "1px solid var(--border-light)" }}>
                      {r.property.address_normalized ?? r.property.address_input}
                    </td>
                    <td style={{ padding: "8px 12px", fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500, color: v ? riskInk(v.risk_score) : "var(--ink-muted)", borderBottom: "1px solid var(--border-light)" }}>
                      {v ? `${v.risk_score}/100` : "not analyzed"}
                    </td>
                    <td style={{ padding: "8px 12px", fontSize: "12px", borderBottom: "1px solid var(--border-light)" }}>
                      {r.loading ? (
                        <span style={{ color: "var(--ink-muted)" }}>fetching…</span>
                      ) : flood?.data ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--ink-secondary)" }}>
                          zone {flood.data.flood_zone ?? "—"}
                          {flood.data.in_special_flood_hazard_area ? " · SFHA" : ""}
                          <ProvenanceBadge provenance={flood.provenance} />
                        </span>
                      ) : (
                        <span style={{ color: "var(--ink-muted)" }}>{r.error ?? "—"}</span>
                      )}
                    </td>
                    <td style={{ padding: "8px 12px", fontSize: "12px", borderBottom: "1px solid var(--border-light)" }}>
                      {contamination?.data ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-mono)", color: "var(--ink-primary)" }}>
                          {contamination.data.superfund_sites_within_radius}
                          <ProvenanceBadge provenance={contamination.provenance} />
                        </span>
                      ) : (
                        r.loading ? <span style={{ color: "var(--ink-muted)" }}>fetching…</span> : "—"
                      )}
                    </td>
                    <td style={{ padding: "8px 12px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--ink-primary)", borderBottom: "1px solid var(--border-light)" }}>
                      {seismic?.data && seismic.data.pga_g != null ? `${seismic.data.pga_g}g` : "—"}
                    </td>
                    <td style={{ padding: "8px 12px", fontSize: "12px", borderBottom: "1px solid var(--border-light)" }}>
                      {disaster?.data ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-mono)", color: "var(--ink-primary)" }}>
                          {disaster.data.declarations_last_10yr}
                          <ProvenanceBadge provenance={disaster.provenance} />
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

      <p style={{ fontSize: "11px", color: "var(--ink-muted)", margin: 0 }}>
        Hazard signals are live federal data: EPA Superfund/brownfield proximity (2-mile radius),
        USGS seismic, and FEMA disaster declarations. These are point-in-time fetches; separately,
        your portfolio is continuously monitored. Material changes are diffed weekly against the
        archived record and pushed to your notifications and weekly digest.
      </p>
    </div>
  );
}
