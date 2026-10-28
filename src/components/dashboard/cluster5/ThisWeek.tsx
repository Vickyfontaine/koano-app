"use client";

// ThisWeek (UI sprint WS4): four tiles that open the Acquire lens. Every
// figure is a count from the book (/api/properties) or the monitoring feed
// (/api/notifications) for the last seven days; nothing is estimated.

import React, { useEffect, useState } from "react";
import type { PortfolioProperty } from "@/app/api/properties/route";
import type { NotificationRow } from "@/app/api/notifications/route";
import { panelStyle, PanelHeader } from "../panels";

const WEEK_MS = 7 * 86400000;

export default function ThisWeek({ properties, id }: { properties: PortfolioProperty[] | null; id?: string }) {
  const [feed, setFeed] = useState<NotificationRow[] | null>(null);
  const [feedError, setFeedError] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/api/notifications?limit=100")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((j) => {
        if (live) setFeed((j.notifications as NotificationRow[]) ?? []);
      })
      .catch(() => {
        if (live) setFeedError(true);
      });
    return () => {
      live = false;
    };
  }, []);

  const holdings = properties?.length ?? null;
  const highRisk = properties ? properties.filter((p) => (p.latest_verdict?.risk_score ?? 0) >= 67).length : null;
  const notAnalyzed = properties ? properties.filter((p) => !p.latest_verdict).length : null;
  const cutoff = Date.now() - WEEK_MS;
  const changes = feed ? feed.filter((n) => new Date(n.created_at).getTime() >= cutoff).length : null;

  const tiles: { label: string; value: string; note: string }[] = [
    { label: "Holdings", value: holdings === null ? "…" : String(holdings), note: "in the book" },
    { label: "Changes, 7 days", value: feedError ? "n/a" : changes === null ? "…" : String(changes), note: feedError ? "feed not loaded" : "from the weekly diff" },
    { label: "High risk", value: highRisk === null ? "…" : String(highRisk), note: "risk 67 or above" },
    { label: "Not analyzed", value: notAnalyzed === null ? "…" : String(notAnalyzed), note: "no verdict yet" },
  ];

  return (
    <div style={panelStyle} id={id}>
      <PanelHeader title="This week" sub="Counts from the book and the weekly diff. Nothing estimated." />
      <div className="this-week-grid">
        {tiles.map((t) => (
          <div key={t.label} className="this-week-tile" aria-busy={t.value === "…"}>
            <span className="tile-label">{t.label}</span>
            <span className="this-week-value">{t.value}</span>
            <span className="card-note">{t.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
