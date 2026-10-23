"use client";

// HoldingCards (UI sprint WS4): the book as cards on phones (the table stays
// from 768px). The latest verdict leads, then risk and the as-of date; the
// same values as the table, with 44px actions.

import React from "react";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import { VERDICT_COLORS, type Verdict } from "@/components/ui/verdict";
import { riskInk } from "../panels";
import type { PortfolioProperty } from "@/app/api/properties/route";

export default function HoldingCards({
  properties,
  analyzingId,
  onAnalyze,
  onRemove,
}: {
  properties: PortfolioProperty[];
  analyzingId: string | null;
  onAnalyze: (p: PortfolioProperty) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="phone-only" style={{ flexDirection: "column", gap: "var(--space-3)" }} role="list" aria-label="Holdings">
      {properties.map((p) => {
        const v = p.latest_verdict;
        const busy = analyzingId === p.id;
        return (
          <div key={p.id} className="holding-card" role="listitem">
            <span className="card-title">{p.address_normalized ?? p.address_input}</span>
            {v ? (
              <dl className="card-figures">
                <div>
                  <dt>Verdict</dt>
                  <dd style={{ color: VERDICT_COLORS[v.verdict as Verdict] ?? "var(--ink-primary)" }}>{v.verdict.toUpperCase()}</dd>
                </div>
                <div>
                  <dt>Confidence</dt>
                  <dd>{v.confidence}</dd>
                </div>
                <div>
                  <dt>Risk</dt>
                  <dd style={{ color: riskInk(v.risk_score) }}>{v.risk_score}</dd>
                </div>
              </dl>
            ) : (
              <span className="card-note">Not analyzed yet.</span>
            )}
            <span style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
              {v && <ProvenanceBadge provenance={v.overall_provenance} />}
              <span className="card-eyebrow">{v ? `as of ${new Date(v.created_at).toLocaleDateString()}` : p.bbl ? `BBL ${p.bbl}` : ""}</span>
            </span>
            <span className="card-actions">
              <button type="button" className="btn-ghost" onClick={() => onAnalyze(p)} disabled={analyzingId !== null}>
                {busy ? "Analyzing…" : v ? "Re-run" : "Analyze"}
              </button>
              <button type="button" className="btn-ghost" onClick={() => onRemove(p.id)} disabled={busy}>
                Remove
              </button>
            </span>
          </div>
        );
      })}
    </div>
  );
}
