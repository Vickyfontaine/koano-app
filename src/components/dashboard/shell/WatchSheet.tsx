"use client";

// WatchSheet (UI sprint WS3): the watchlist, reachable from every lens. Lists
// the properties KOANO monitors for this account (the same rows the Portfolio
// lens manages), with each one's latest verdict. Adding and removing stay in
// the Portfolio lens; this sheet is the cross-lens view of what is watched.

import React, { useEffect, useState } from "react";
import Sheet from "./Sheet";
import { VERDICT_COLORS, type Verdict } from "@/components/ui/verdict";
import type { PortfolioProperty } from "@/app/api/properties/route";

interface WatchSheetProps {
  open: boolean;
  onClose: () => void;
  onGoToPortfolio: () => void;
}

export default function WatchSheet({ open, onClose, onGoToPortfolio }: WatchSheetProps) {
  const [rows, setRows] = useState<PortfolioProperty[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setRows(null);
    setError(null);
    fetch("/api/properties")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || `Request failed (${r.status})`);
        if (!cancelled) setRows(j.properties as PortfolioProperty[]);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load the watchlist");
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Sheet open={open} title="Watchlist" onClose={onClose} id="shell-watch-sheet">
      <p style={{ margin: 0, fontSize: "var(--text-body)", lineHeight: 1.5, color: "var(--ink-secondary)" }}>
        The properties in your book. KOANO checks each one&apos;s public record every week and reports what changed in the
        Acquire lens and the Monday digest.
      </p>

      {rows === null && !error && (
        <ul className="shell-watch-list" aria-busy="true" aria-label="Loading the watchlist">
          {[0, 1, 2].map((i) => (
            <li key={i} className="shell-watch-row shell-watch-skeleton" aria-hidden="true">
              <span style={{ width: `${62 - i * 10}%` }} />
              <span style={{ width: "28%" }} />
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p style={{ margin: 0, fontSize: "var(--text-body)", color: "var(--signal-negative-ink)" }}>{error}</p>
      )}
      {rows && rows.length === 0 && (
        <div className="shell-watch-empty">
          <p style={{ margin: 0, fontSize: "var(--text-ui)", fontWeight: 500, color: "var(--ink-primary)" }}>
            Nothing watched yet.
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "var(--text-body)", color: "var(--ink-muted)", lineHeight: 1.5 }}>
            Add a property in the Acquire lens and it appears here with its weekly changes.
          </p>
        </div>
      )}
      {rows && rows.length > 0 && (
        <ul className="shell-watch-list">
          {rows.map((p) => {
            const v = p.latest_verdict;
            return (
              <li key={p.id} className="shell-watch-row">
                <span className="shell-watch-address">{p.address_normalized ?? p.address_input}</span>
                {v ? (
                  <span
                    className="shell-watch-verdict"
                    style={{ color: VERDICT_COLORS[v.verdict as Verdict] ?? "var(--ink-primary)" }}
                  >
                    {v.verdict.toUpperCase()} · conf {v.confidence}
                  </span>
                ) : (
                  <span className="shell-watch-verdict" style={{ color: "var(--ink-muted)" }}>
                    not analyzed
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <button type="button" className="btn-ghost" onClick={onGoToPortfolio} style={{ alignSelf: "flex-start" }}>
        Manage in the Acquire lens
      </button>

    </Sheet>
  );
}
