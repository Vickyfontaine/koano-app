"use client";

// CompsScatter — Cluster 2. The comparable recorded sales plotted as $/sqft over
// time, each point colored on the same diverging scale as the comps map (cheaper
// = blue, pricier = magenta), with a dashed reference line at the indicative
// value. Turns the comps table into a read on where the market has been moving.

import React from "react";
import Scatter, { type AxisTick, type ScatterPoint } from "@/components/ui/charts/Scatter";
import { compDivergingColor } from "@/components/ui/map/mapColors";
import { panelStyle, PanelHeader } from "../panels";
import type { SiteDetailResponse } from "@/app/api/site-detail/route";

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

function monthLabel(ts: number): string {
  const d = new Date(ts);
  return `${d.toLocaleString("en-US", { month: "short" })} '${String(d.getFullYear()).slice(2)}`;
}

export default function CompsScatter({
  detail,
  id,
}: {
  detail: SiteDetailResponse | null;
  id?: string;
}) {
  const block = detail?.mls_comps;
  const data = block?.data;
  const comps = (data?.comps ?? []).filter((c) => c.sale_date && Number.isFinite(c.price_per_sqft));

  if (!data || comps.length < 2) {
    return (
      <section id={id} style={panelStyle}>
        <PanelHeader title="Price per sq ft over time" provenance={block?.provenance} />
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
          {block ? "Not enough recorded sales to plot a price trend." : "Run an address to see the comp price trend."}
        </p>
      </section>
    );
  }

  const indicative = data.median_price_per_sqft;
  const psfs = comps.map((c) => c.price_per_sqft);
  const lo = Math.min(...psfs);
  const hi = Math.max(...psfs);
  // The x-axis is the full 12-month lookback window (not the data span), so a
  // month with no plotted sale reads as a real gap within a stated year, not a
  // truncated axis.
  const DAY = 86400000;
  const now = Date.now();
  const xStart = now - 365 * DAY;
  const xDomain: [number, number] = [xStart, now];
  const yLo = Math.min(lo, indicative);
  const yHi = Math.max(hi, indicative);
  const padY = (yHi - yLo) * 0.12 || yHi * 0.1;
  const yDomain: [number, number] = [Math.max(0, yLo - padY), yHi + padY];

  const muted = block!.provenance === "representative";
  const points: ScatterPoint[] = comps.map((c, i) => ({
    key: `${c.sale_date}-${c.price_per_sqft}-${i}`,
    x: new Date(c.sale_date).getTime(),
    y: c.price_per_sqft,
    color: compDivergingColor(c.price_per_sqft, indicative, lo, hi),
    muted,
    title: `${c.address}\n${money(c.price_per_sqft)}/sf · ${c.sale_date}`,
  }));

  const xTicks: AxisTick[] = [0, 1, 2, 3, 4].map((k) => {
    const v = xStart + ((now - xStart) * k) / 4;
    return { value: v, label: monthLabel(v) };
  });
  const yTicks: AxisTick[] = [yDomain[0], (yDomain[0] + yDomain[1]) / 2, yDomain[1]].map((v) => ({
    value: v,
    label: money(v),
  }));

  return (
    <section id={id} style={panelStyle}>
      <PanelHeader title="Price per sq ft over time" provenance={block!.provenance} />
      <Scatter
        points={points}
        xDomain={xDomain}
        yDomain={yDomain}
        xTicks={xTicks}
        yTicks={yTicks}
        refLine={{ y: indicative, label: `indicative ${money(indicative)}/sf` }}
      />
      <p style={{ fontSize: "12px", color: "var(--ink-faint)", margin: 0, lineHeight: 1.5 }}>
        {data.sales_count > comps.length
          ? `The ${comps.length} nearest of ${data.sales_count.toLocaleString()} qualifying residential sales within ~1 mile`
          : `${comps.length} qualifying residential sales within ~1 mile`}
        , over the last 12 months — colored by $/sq ft against the indicative value. Gaps are months
        when none of these {comps.length} sold, not neighborhood-wide absence. Condos/co-ops without
        recorded square footage are excluded.
      </p>
    </section>
  );
}
