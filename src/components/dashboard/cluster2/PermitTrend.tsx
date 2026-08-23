"use client";

// PermitTrend — Cluster 2. Neighborhood (census-tract) building-permit activity
// bucketed by month over the last 24 months — the development pipeline as a
// trend, not a single count. Backed by the monthly series the permits provider
// now emits (same scope as its aggregate totals).

import React from "react";
import BarChart, { type BarDatum } from "@/components/ui/charts/BarChart";
import { DOMAIN_DEVELOPMENT, DOMAIN_DEVELOPMENT_EDGE } from "@/components/ui/charts/domains";
import { panelStyle, PanelHeader } from "../panels";
import type { SiteDetailResponse } from "@/app/api/site-detail/route";

function fmtMonth(m: string): string {
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return `${d.toLocaleString("en-US", { month: "short" })} '${y.slice(2)}`;
}

export default function PermitTrend({
  detail,
  id,
}: {
  detail: SiteDetailResponse | null;
  id?: string;
}) {
  const block = detail?.permits;
  const data = block?.data;
  const months = data?.monthly_permits ?? [];

  if (!data || months.length === 0) {
    return (
      <section id={id} style={panelStyle}>
        <PanelHeader title="Neighborhood permits — 24 months" provenance={block?.provenance} />
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
          {block ? "No permit trend available for this location." : "Run an address to see permit activity."}
        </p>
      </section>
    );
  }

  const muted = block!.provenance === "representative";
  const bars: BarDatum[] = months.map((m) => ({
    key: m.month,
    label: fmtMonth(m.month),
    value: m.count,
    muted,
    title: `${fmtMonth(m.month)}: ${m.count} permit${m.count === 1 ? "" : "s"}`,
  }));

  return (
    <section id={id} style={panelStyle}>
      <PanelHeader title="Neighborhood permits — 24 months" provenance={block!.provenance} />
      <BarChart
        data={bars}
        axisEvery={3}
        yAxis
        color={DOMAIN_DEVELOPMENT}
        borderColor={DOMAIN_DEVELOPMENT_EDGE}
        ariaLabel="Monthly permit counts, last 24 months"
      />
      <p style={{ fontSize: "12px", color: "var(--ink-faint)", margin: 0, lineHeight: 1.5 }}>
        {data.total_permits_24mo.toLocaleString()} permits issued in the last 24 months
        {" — "}
        {data.new_building_permits.toLocaleString()} new-building, {data.demolition_permits.toLocaleString()} demolition,{" "}
        {data.alteration_permits.toLocaleString()} alteration. {data.scope_note}
      </p>
    </section>
  );
}
