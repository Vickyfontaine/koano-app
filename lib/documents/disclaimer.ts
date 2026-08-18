// KOANO document engine — the non-bypassable integrity contract.
// Two things every rendered document MUST carry, enforced structurally so no
// document type can omit them:
//   1. The disclaimer footer (verbatim, on every page).
//   2. The provenance appendix (every figure's source + the weakest-input
//      rollup), so a forwarded document remains auditable and honest.
// The renderer (Slice 3) paints these; this module is their format-agnostic
// source of truth.

import type { BlockKey } from '../providers/blocks';
import type { Provenance } from '../providers/types';
import type { DocumentData } from './types';

// VERBATIM — do not edit. This is a legal safeguard, not copy. It renders on
// every page of every document. Documents are forwardable and leave the
// product, so this can never be optional or per-type.
export const DOCUMENT_DISCLAIMER =
  'Informational only. Generated from public data by automated analysis. ' +
  'Not professional real estate, legal, tax, or appraisal advice.';

// Human labels for each provider block, for the provenance appendix.
const BLOCK_LABELS: Record<BlockKey, string> = {
  zoning: 'Zoning / PLUTO',
  permits: 'Building permits',
  opportunity_zone: 'Opportunity Zone status',
  proforma: 'Pro forma benchmarks',
  flood: 'Flood zone',
  demographics: 'Demographics (ACS)',
  hpi: 'House Price Index',
  mls_comps: 'Comparable sales',
  crime: 'Crime statistics',
  building_violations: 'Building violations',
  landlord_portfolio: 'Ownership / landlord portfolio',
  search_trends: 'Search interest',
  foot_traffic: 'Foot traffic',
  premium_hazard: 'Premium hazard',
  costar_deals: 'Commercial deals',
  assemblage: 'Assemblage / air rights',
  entitlement: 'Entitlement track record',
};

export interface ProvenanceAppendixRow {
  block: string; // human label
  source: string; // provider's source string
  provenance: Provenance;
  fetched_at: string;
  swap_note?: string; // representative blocks: which paid source makes it live
  fallback_note?: string; // a normally-live block that fell back this call
}

export interface ProvenanceAppendix {
  overall: Provenance;
  // A plain-language rollup line printed under the appendix heading.
  overall_note: string;
  rows: ProvenanceAppendixRow[];
}

// Build the provenance appendix from assembled data. Every fetched block
// becomes one row; the overall line states, in plain language, whether the
// whole document is live or contains representative figures.
export function buildProvenanceAppendix(data: DocumentData): ProvenanceAppendix {
  const rows: ProvenanceAppendixRow[] = [];

  for (const key of Object.keys(data.blocks) as BlockKey[]) {
    const block = data.blocks[key];
    if (!block) continue;
    // A normally-live block that errored fell back to representative: label it
    // as such rather than hiding the transient failure (Principle 2).
    const fellBack = block.provenance === 'representative' && !!block.error;
    rows.push({
      block: BLOCK_LABELS[key],
      source: block.source,
      provenance: block.provenance,
      fetched_at: block.fetched_at,
      ...(block.swap_note ? { swap_note: block.swap_note } : {}),
      ...(fellBack
        ? { fallback_note: 'Live source was unavailable this request; a representative value was used.' }
        : {}),
    });
  }

  const overall_note =
    data.overall_provenance === 'live'
      ? 'Every figure in this document was fetched live from an authoritative public source at generation time.'
      : 'This document contains one or more representative figures (labeled below). It is not fully live: any figure marked representative is a plausible stand-in for a paid data source that is not yet integrated.';

  return { overall: data.overall_provenance, overall_note, rows };
}
