"use client";

// SiteCards (UI sprint WS4, A3): the ranked sites as cards. A swipe list on
// phones, a row from 768px. Each card carries the same figures the ranking
// table shows (rank, verdict, confidence, risk), the buildable envelope from
// live PLUTO when present, and the structural guard when one applied. Tapping
// a card puts that site in the shell's verdict band and zooms the map to its lot.

import React from "react";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import { VERDICT_COLORS, type SynthesisResult } from "@/components/ui/verdict";
import { riskInk, fmtInt } from "../panels";
import type { SiteDetailResponse } from "@/app/api/site-detail/route";

const GUARD_LABEL: Record<string, string> = {
  active_construction: "active ground-up permit on the lot, FAR upside not counted",
  coop_condo: "co-op or condo, FAR upside not counted",
  likely_stabilized: "likely rent-stabilized, FAR upside not counted",
};

export interface SiteCardData {
  slot: number;
  rank: number;
  address: string;
  verdict: SynthesisResult;
  detail: SiteDetailResponse | null;
}

export default function SiteCards({
  sites,
  selected,
  onSelect,
}: {
  sites: SiteCardData[];
  selected: number | null;
  onSelect: (slot: number) => void;
}) {
  if (sites.length === 0) return null;
  return (
    <div className="swipe-list" role="list" aria-label="Ranked sites">
      {sites.map((s) => {
        const z = s.detail?.zoning?.data;
        const guardKey = (s.verdict.weighting_breakdown as { structural_guard?: string | null } | undefined)?.structural_guard ?? null;
        const guard = guardKey ? GUARD_LABEL[guardKey] ?? guardKey : null;
        const unused = z?.unused_far_pct;
        return (
          <div key={s.slot} role="listitem" style={{ display: "flex", minWidth: 0 }}>
          <button
            type="button"
            className="site-card"
            aria-pressed={selected === s.slot}
            onClick={() => onSelect(s.slot)}
            style={{ textAlign: "left", cursor: "pointer", font: "inherit", width: "100%" }}
          >
            <span className="card-eyebrow">
              Rank #{s.rank} · <span style={{ color: VERDICT_COLORS[s.verdict.verdict] }}>{s.verdict.verdict.toUpperCase()}</span>
            </span>
            <span className="card-title">{s.address}</span>
            <dl className="card-figures">
              <div>
                <dt>Confidence</dt>
                <dd>{s.verdict.confidence}</dd>
              </div>
              <div>
                <dt>Risk</dt>
                <dd style={{ color: riskInk(s.verdict.risk_score) }}>{s.verdict.risk_score}</dd>
              </div>
              <div>
                <dt>Unused FAR</dt>
                <dd>{unused != null ? `${unused}%` : "n/a"}</dd>
              </div>
            </dl>
            {z && (
              <span className="card-note">
                {z.zoning_district ?? "Zoning n/a"}
                {z.building_area_sqft != null ? ` · ${fmtInt(z.building_area_sqft)} sq ft built` : ""}
                {z.max_residential_far != null ? ` · max FAR ${z.max_residential_far}` : ""}
              </span>
            )}
            {guard && (
              <span className="card-note" style={{ color: "var(--signal-warning-ink)" }}>
                Guard: {guard}
              </span>
            )}
            <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
              <ProvenanceBadge provenance={s.verdict.overall_provenance} />
              <span className="card-eyebrow">{selected === s.slot ? "In the band" : "Tap to show in the band"}</span>
            </span>
          </button>
          </div>
        );
      })}
    </div>
  );
}
