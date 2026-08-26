"use client";

// UpgradeScreen — shown as a modal when the guard returns 402 upgrade_required
// (repurposed from the retired approval-based AccessPending). Presents the four
// paid tiers with approved cluster copy; selecting one POSTs /api/stripe/checkout
// and redirects to the returned Stripe URL. Client-safe: imports only clusters.ts
// (no server Stripe SDK); tier names are plain strings the checkout route validates.

import React, { useState } from "react";
import { CLUSTERS, type ClusterId } from "./clusters";

export type PaidTier = "community" | "transaction" | "development" | "portfolio";

export interface UpgradeDetail {
  plan: string; // the user's current plan (free)
  kind: "verdict" | "content";
  limit: number;
}

// Paid tier → the cluster whose approved copy describes it (Section 08/13).
const TIER_ORDER: { tier: PaidTier; clusterId: ClusterId }[] = [
  { tier: "community", clusterId: "cluster_1" },
  { tier: "transaction", clusterId: "cluster_2" },
  { tier: "development", clusterId: "cluster_4" },
  { tier: "portfolio", clusterId: "cluster_5" },
];

export default function UpgradeScreen({
  detail,
  onClose,
}: {
  detail: UpgradeDetail;
  onClose: () => void;
}) {
  const [busyTier, setBusyTier] = useState<PaidTier | null>(null);
  const [error, setError] = useState<string | null>(null);

  const noun = detail.kind === "verdict" ? "verdict runs" : "generated documents";

  async function choose(tier: PaidTier) {
    if (busyTier) return;
    setBusyTier(tier);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json?.error || "Could not start checkout");
      window.location.href = json.url as string;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout");
      setBusyTier(null);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(13, 43, 62, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--white)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "32px",
          maxWidth: "860px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "var(--brand-blue)",
            }}
          >
            Upgrade
          </span>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--ink-primary)",
              margin: 0,
            }}
          >
            You&apos;ve used all {detail.limit} free {noun}.
          </h1>
          <p style={{ fontSize: "15px", lineHeight: 1.6, color: "var(--ink-secondary)", margin: 0 }}>
            Pick a plan to keep going. Every analysis runs the same engine. The plan sets how much
            you can run. You can change or cancel anytime.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
          }}
        >
          {TIER_ORDER.map(({ tier, clusterId }) => {
            const c = CLUSTERS[clusterId];
            const busy = busyTier === tier;
            return (
              <button
                key={tier}
                onClick={() => choose(tier)}
                disabled={busyTier !== null}
                style={{
                  textAlign: "left",
                  background: "var(--white)",
                  border: "1px solid var(--border)",
                  borderRadius: "16px",
                  padding: "20px",
                  cursor: busyTier ? "wait" : "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  opacity: busyTier !== null && !busy ? 0.55 : 1,
                }}
              >
                <span className="section-number">{c.number}</span>
                <span style={{ fontSize: "17px", fontWeight: 500, color: "var(--ink-primary)" }}>
                  {c.label}
                </span>
                <span style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--ink-secondary)", flex: 1 }}>
                  {c.tagline}
                </span>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--mid-blue)",
                  }}
                >
                  {busy ? "Starting checkout…" : c.price}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <p style={{ fontSize: "13px", color: "var(--signal-negative)", margin: 0 }}>{error}</p>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={onClose}
            disabled={busyTier !== null}
            style={{
              border: "1px solid var(--border)",
              background: "transparent",
              borderRadius: "100px",
              padding: "9px 20px",
              fontFamily: "inherit",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--ink-muted)",
              cursor: busyTier ? "not-allowed" : "pointer",
            }}
          >
            Maybe later
          </button>
          <span style={{ fontSize: "12px", color: "var(--ink-faint)" }}>
            Secure checkout by Stripe · test mode
          </span>
        </div>
      </div>
    </div>
  );
}
