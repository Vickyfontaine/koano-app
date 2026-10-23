"use client";

// CompCards (UI sprint WS4): the comparable sales as swipe cards on phones
// (the table stays from 768px). Distance from the subject and the block's
// provenance on every card; the same figures as the table.

import React from "react";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import type { Provenance } from "@/components/ui/verdict";
import { fmtInt, fmtMoney } from "../panels";

interface Comp {
  address: string;
  sale_price: number;
  sale_date: string;
  gross_square_feet: number | null;
  price_per_sqft: number;
  distance_mi?: number | null;
}

export default function CompCards({ comps, provenance, inPanel = false }: { comps: Comp[]; provenance: Provenance; inPanel?: boolean }) {
  return (
    <div className={`swipe-list phone-only${inPanel ? " in-panel" : ""}`} role="list" aria-label="Comparable sales">
      {comps.map((c, i) => (
        <div key={`${c.address}-${i}`} className="comp-card" role="listitem">
          <span className="card-eyebrow">
            {c.distance_mi != null ? `${c.distance_mi.toFixed(2)} mi away` : "Comparable"} · {c.sale_date}
          </span>
          <span className="card-title">{c.address}</span>
          <dl className="card-figures">
            <div>
              <dt>Sale</dt>
              <dd>{fmtMoney(c.sale_price)}</dd>
            </div>
            <div>
              <dt>Sq ft</dt>
              <dd>{fmtInt(c.gross_square_feet)}</dd>
            </div>
            <div>
              <dt>$ / sq ft</dt>
              <dd>{fmtMoney(c.price_per_sqft)}</dd>
            </div>
          </dl>
          <ProvenanceBadge provenance={provenance} />
        </div>
      ))}
    </div>
  );
}
