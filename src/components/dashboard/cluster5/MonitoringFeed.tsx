"use client";

// MonitoringFeed — Cluster 5 portfolio-wide change feed. Same deterministic
// weekly diff that drives the Cluster-1 AlertsPanel and the Monday digest, but
// unscoped: every watched holding, newest change first. This is the recurring-
// revenue surface (Phase 2) made visible at portfolio altitude — "monitor
// everything, miss nothing."
//
// Every row is a factual before/after claim the diff engine literally read from
// two archived snapshots (structural grounding, §07B) — no free text, no model.

import React, { useEffect, useState } from "react";
import type { NotificationRow } from "@/app/api/notifications/route";

const NOTIF_COLOR: Record<string, string> = {
  high: "var(--signal-negative)",
  material: "var(--signal-warning)",
  info: "var(--mid-blue)",
};

const panelStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "20px",
  background: "var(--white)",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

export default function MonitoringFeed({ id }: { id?: string }) {
  const [feed, setFeed] = useState<NotificationRow[] | null>(null);
  const [unread, setUnread] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/notifications?limit=40")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Request failed (${r.status})`))))
      .then((j) => {
        if (!live) return;
        setFeed((j.notifications as NotificationRow[]) ?? []);
        setUnread(typeof j.unread_count === "number" ? j.unread_count : 0);
      })
      .catch((e) => {
        if (live) setError(e instanceof Error ? e.message : "Could not load monitoring feed");
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <div style={panelStyle} id={id}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <span className="section-number">05.M</span>
          <h2 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink-primary)", margin: "8px 0 2px" }}>
            Portfolio monitoring
          </h2>
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
            Weekly diff on the archived public record, every watched holding.
          </p>
        </div>
        {feed && feed.length > 0 && unread > 0 && (
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              letterSpacing: "0.06em",
              color: "var(--ink-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "100px",
              padding: "4px 10px",
              whiteSpace: "nowrap",
            }}
          >
            {unread} unread
          </span>
        )}
      </div>

      {error ? (
        <p style={{ fontSize: "13px", color: "var(--ink-secondary)", margin: 0 }}>{error}</p>
      ) : !feed ? (
        <p style={{ fontSize: "13px", color: "var(--ink-faint)", margin: 0 }}>Loading changes…</p>
      ) : feed.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0, lineHeight: 1.55 }}>
          No changes detected across the portfolio yet. Each watched property establishes a silent
          baseline the first week it is seen; changes appear here from the next weekly diff onward.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {feed.map((n) => {
            const w = n.data as { window_from?: string; window_to?: string };
            return (
              <div key={n.id} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: NOTIF_COLOR[n.severity] ?? "var(--mid-blue)",
                    marginTop: "6px",
                    flexShrink: 0,
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1 }}>
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--ink-primary)" }}>{n.title}</span>
                  <span style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--ink-secondary)" }}>{n.body}</span>
                  {w.window_from && w.window_to && (
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "var(--ink-faint)" }}>
                      compared {w.window_from} → {w.window_to}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ fontSize: "11px", color: "var(--ink-faint)", margin: 0 }}>
        Changes are stated as before/after values read directly from two archived snapshots, never
        inferred. A Monday email digest carries the same feed.
      </p>
    </div>
  );
}
