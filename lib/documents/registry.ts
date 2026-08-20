// KOANO document registry — the single declarative table of every document the
// engine can produce. Each entry is data the engine reads; adding a document is
// adding a row here, never branching logic elsewhere.
//
// Tier gate is derived, not hand-listed: a document is generable by its
// `homeTier` and every richer plan (see allowedPlansFor in ./guard). That makes
// the ladder monotonic by construction — a community subscriber cannot generate
// an IC memo, because ic_memo.homeTier is 'portfolio'.
//
// Two documents are `blocked`: they depend on a by-design representative
// provider and must not ship until it goes live. Flipping `status` to
// 'available' is the same one-line change as swapping the provider itself.
//
// Renderers are built incrementally (Slice 4+). A registry entry declaring a
// document does NOT imply a renderer exists yet; the /api/documents route
// implements types one at a time and refuses the rest with a clear message.

import type { DocumentType } from './types';

export const DOCUMENT_TYPES: Record<string, DocumentType> = {
  // ---- Community (Cluster 1) — homeTier 'community' -----------------------
  property_intelligence_report: {
    id: 'property_intelligence_report',
    title: 'Property Intelligence Report',
    cluster: 'cluster_1',
    homeTier: 'community',
    scope: 'property',
    requiredBlocks: [
      'zoning',
      'mls_comps',
      'permits',
      'building_violations',
      'landlord_portfolio',
      'flood',
      'opportunity_zone',
      'demographics',
      'hpi',
    ],
    formats: ['pdf'],
    sections: [
      { id: 'identity', title: 'What This Property Is', kind: 'deterministic' },
      { id: 'valuation', title: 'What It Is Worth (Indicative)', kind: 'deterministic' },
      { id: 'context', title: 'Where the Neighborhood Is Heading', kind: 'deterministic' },
      { id: 'record', title: 'Public Record — What to Watch', kind: 'deterministic' },
      { id: 'trajectory', title: 'Neighborhood Trajectory', kind: 'narrative' },
      { id: 'provenance', title: 'Sources & Provenance', kind: 'deterministic' },
    ],
    status: 'available',
  },

  tax_appeal_packet: {
    id: 'tax_appeal_packet',
    title: 'Property Tax Appeal Evidence Packet',
    cluster: 'cluster_1',
    homeTier: 'community',
    scope: 'property',
    // All-live for NYC: PLUTO building area (zoning block) + recorded-sale
    // comps (mls_comps block, NYC DOF rolling sales).
    requiredBlocks: ['zoning', 'mls_comps'],
    formats: ['pdf'],
    sections: [
      { id: 'cover', title: 'Cover', kind: 'deterministic' },
      { id: 'assessment_summary', title: 'Assessment Summary', kind: 'deterministic' },
      { id: 'comps_table', title: 'Comparable Recorded Sales', kind: 'deterministic' },
      { id: 'value_gap', title: 'Indicative Value vs. Assessment', kind: 'deterministic' },
      { id: 'argument', title: 'Basis for Appeal', kind: 'narrative' },
      { id: 'provenance', title: 'Sources & Provenance', kind: 'deterministic' },
    ],
    status: 'available',
  },

  violation_ownership_record: {
    id: 'violation_ownership_record',
    title: 'Violation & Ownership Record',
    cluster: 'cluster_1',
    homeTier: 'community',
    scope: 'property',
    requiredBlocks: ['zoning', 'building_violations', 'landlord_portfolio'],
    formats: ['pdf'],
    sections: [
      { id: 'identity', title: 'Building Identity', kind: 'deterministic' },
      { id: 'coverage', title: 'Coverage & How to Read This Record', kind: 'deterministic' },
      { id: 'ownership', title: 'Registered Ownership', kind: 'deterministic' },
      { id: 'portfolio', title: 'Owner Portfolio', kind: 'deterministic' },
      { id: 'summary', title: 'Violation Summary', kind: 'deterministic' },
      { id: 'record', title: 'Full Violation Record', kind: 'deterministic' },
      { id: 'provenance', title: 'Sources & Provenance', kind: 'deterministic' },
    ],
    status: 'available',
  },

  permit_history_report: {
    id: 'permit_history_report',
    title: 'Permit History Report',
    cluster: 'cluster_1',
    homeTier: 'community',
    scope: 'property',
    requiredBlocks: ['zoning', 'permits'],
    formats: ['pdf'],
    sections: [
      { id: 'identity', title: 'Building Identity', kind: 'deterministic' },
      { id: 'history', title: 'Subject Building Permit History', kind: 'deterministic' },
      { id: 'flags', title: 'Open & Expired Permits', kind: 'deterministic' },
      { id: 'neighborhood', title: 'Neighborhood Permit Activity', kind: 'deterministic' },
      { id: 'provenance', title: 'Sources & Provenance', kind: 'deterministic' },
    ],
    status: 'available',
  },

  // ---- Transaction (Cluster 2) — homeTier 'transaction' -------------------
  cma: {
    id: 'cma',
    title: 'Comparative Market Analysis',
    cluster: 'cluster_2',
    homeTier: 'transaction',
    scope: 'property',
    requiredBlocks: ['mls_comps', 'zoning', 'hpi', 'mortgage_demand'],
    formats: ['pdf', 'docx'], // DOCX so a broker can edit before sending
    sections: [
      { id: 'cover', title: 'Cover', kind: 'deterministic' },
      { id: 'comps_table', title: 'Comparable Sales', kind: 'deterministic' },
      { id: 'pricing', title: 'Pricing Recommendation', kind: 'deterministic' },
      { id: 'narrative', title: 'Market Narrative', kind: 'narrative' },
      { id: 'provenance', title: 'Sources & Provenance', kind: 'deterministic' },
    ],
    status: 'available',
  },

  client_neighborhood_report: {
    id: 'client_neighborhood_report',
    title: 'Client Neighborhood Report',
    cluster: 'cluster_2',
    homeTier: 'transaction',
    scope: 'property',
    requiredBlocks: ['mls_comps', 'hpi', 'permits', 'demographics', 'flood'],
    formats: ['pdf'],
    sections: [
      { id: 'snapshot', title: 'Neighborhood Snapshot', kind: 'deterministic' },
      { id: 'narrative', title: 'Neighborhood Narrative', kind: 'narrative' },
      { id: 'provenance', title: 'Sources & Provenance', kind: 'deterministic' },
    ],
    status: 'available',
  },

  pricing_recommendation_sheet: {
    id: 'pricing_recommendation_sheet',
    title: 'Pricing Recommendation Sheet',
    cluster: 'cluster_2',
    homeTier: 'transaction',
    scope: 'property',
    requiredBlocks: ['mls_comps', 'zoning', 'hpi'],
    formats: ['pdf'],
    sections: [
      { id: 'pricing', title: 'Recommended Price Band', kind: 'deterministic' },
      { id: 'selection', title: 'How These Comparables Were Selected', kind: 'deterministic' },
      { id: 'comps', title: 'Comparable Recorded Sales', kind: 'deterministic' },
      { id: 'provenance', title: 'Sources & Provenance', kind: 'deterministic' },
    ],
    status: 'available',
  },

  buyer_seller_net_sheet: {
    id: 'buyer_seller_net_sheet',
    title: 'Buyer / Seller Net Sheet',
    cluster: 'cluster_2',
    homeTier: 'transaction',
    scope: 'property',
    requiredBlocks: ['mls_comps', 'zoning'],
    formats: ['pdf'],
    sections: [
      { id: 'assumed_price', title: 'Assumed Sale Price', kind: 'deterministic' },
      { id: 'costs', title: 'Closing Costs — You Provide These', kind: 'deterministic' },
      { id: 'net', title: 'Estimated Net', kind: 'deterministic' },
      { id: 'provenance', title: 'Sources & Provenance', kind: 'deterministic' },
    ],
    status: 'available',
  },

  // ---- Development (Cluster 4) — homeTier 'development' --------------------
  site_comparison_report: {
    id: 'site_comparison_report',
    title: 'Site Comparison Report',
    cluster: 'cluster_4',
    homeTier: 'development',
    scope: 'multi_site',
    requiredBlocks: ['zoning', 'permits', 'opportunity_zone', 'flood'],
    formats: ['pdf'],
    sections: [
      { id: 'cover', title: 'Cover', kind: 'deterministic' },
      { id: 'ranking', title: 'Risk-Adjusted Ranking', kind: 'deterministic' },
      { id: 'per_site', title: 'Per-Site Detail', kind: 'deterministic' },
      { id: 'narrative', title: 'Recommendation', kind: 'narrative' },
      { id: 'provenance', title: 'Sources & Provenance', kind: 'deterministic' },
    ],
    status: 'available',
  },

  entitlement_risk_memo: {
    id: 'entitlement_risk_memo',
    title: 'Entitlement Risk Memo',
    cluster: 'cluster_4',
    homeTier: 'development',
    scope: 'property',
    requiredBlocks: ['zoning', 'opportunity_zone', 'permits', 'entitlement'],
    formats: ['pdf'],
    sections: [
      { id: 'context', title: 'Zoning & Entitlement Context', kind: 'deterministic' },
      { id: 'track_record', title: 'Community District Track Record', kind: 'deterministic' },
      { id: 'filings', title: 'Subject-Lot Filing History', kind: 'deterministic' },
      { id: 'narrative', title: 'Risk Assessment', kind: 'narrative' },
      { id: 'provenance', title: 'Sources & Provenance', kind: 'deterministic' },
    ],
    status: 'available',
  },

  pro_forma_summary: {
    id: 'pro_forma_summary',
    title: 'Pro Forma Summary',
    cluster: 'cluster_4',
    homeTier: 'development',
    scope: 'property',
    requiredBlocks: ['zoning', 'proforma'],
    formats: ['pdf'],
    sections: [
      { id: 'cover', title: 'Cover', kind: 'deterministic' },
      { id: 'proforma', title: 'Pro Forma Benchmarks', kind: 'deterministic' },
      { id: 'provenance', title: 'Sources & Provenance', kind: 'deterministic' },
    ],
    // BLOCKED: the pro forma benchmark provider is representative by design.
    // Do not ship until CoStar-tier data is funded and the provider goes live.
    status: 'blocked',
    blockedOn: 'proformaBenchmark',
  },

  zoning_far_analysis: {
    id: 'zoning_far_analysis',
    title: 'Zoning / FAR Analysis',
    cluster: 'cluster_4',
    homeTier: 'development',
    scope: 'property',
    requiredBlocks: ['zoning'],
    formats: ['pdf'],
    sections: [
      { id: 'cover', title: 'Cover', kind: 'deterministic' },
      { id: 'far', title: 'FAR & Buildable Area', kind: 'deterministic' },
      { id: 'provenance', title: 'Sources & Provenance', kind: 'deterministic' },
    ],
    status: 'available',
  },

  // The two build targets: all-live, PDF only, no financial modelling
  // (screening, not feasibility). No `proforma` block (representative).
  site_screening_memo: {
    id: 'site_screening_memo',
    title: 'Development Site Screening Memo',
    cluster: 'cluster_4',
    homeTier: 'development',
    scope: 'property',
    requiredBlocks: [
      'zoning',
      'opportunity_zone',
      'assemblage',
      'entitlement',
      'permits',
      'mls_comps',
      'demographics',
      'hpi',
      'flood',
      'building_violations',
      'landlord_portfolio',
    ],
    formats: ['pdf'],
    sections: [
      { id: 'verdict', title: 'Verdict', kind: 'deterministic' },
      { id: 'site_identity', title: 'Site Identity', kind: 'deterministic' },
      { id: 'envelope', title: 'As-of-Right Envelope', kind: 'deterministic' },
      { id: 'entitlement', title: 'Entitlement Risk Read', kind: 'deterministic' },
      { id: 'assemblage', title: 'Assemblage & Air Rights', kind: 'deterministic' },
      { id: 'dd_gap', title: 'Due Diligence Gap Register', kind: 'deterministic' },
      { id: 'proof_points', title: 'Proof Points', kind: 'deterministic' },
      { id: 'risk_mitigant', title: 'Risk & Mitigant', kind: 'deterministic' },
      { id: 'reasoning', title: 'Reasoning', kind: 'narrative' }, // the single model call
      { id: 'provenance', title: 'Sources & Provenance', kind: 'deterministic' },
    ],
    status: 'available',
  },

  three_site_comparison_brief: {
    id: 'three_site_comparison_brief',
    title: 'Three-Site Comparison Brief',
    cluster: 'cluster_4',
    homeTier: 'development',
    scope: 'multi_site',
    requiredBlocks: [
      'zoning',
      'opportunity_zone',
      'assemblage',
      'entitlement',
      'permits',
      'mls_comps',
      'demographics',
      'hpi',
      'flood',
      'building_violations',
      'landlord_portfolio',
    ],
    formats: ['pdf'],
    sections: [
      { id: 'grid', title: 'Comparison Grid', kind: 'deterministic' },
      { id: 'reasoning', title: 'Reasoning', kind: 'narrative' }, // one call across all sites
      { id: 'provenance', title: 'Sources & Provenance', kind: 'deterministic' },
    ],
    status: 'available',
  },

  // ---- Portfolio (Cluster 5) — homeTier 'portfolio' -----------------------
  ic_memo: {
    id: 'ic_memo',
    title: 'Investment Committee Memo',
    cluster: 'cluster_5',
    homeTier: 'portfolio',
    scope: 'property',
    requiredBlocks: [
      'zoning',
      'mls_comps',
      'hpi',
      'demographics',
      'opportunity_zone',
      'flood',
      'permits',
      'building_violations',
      'landlord_portfolio',
      'entitlement',
    ],
    formats: ['pdf', 'docx'], // DOCX so an analyst can complete the scaffold sections
    sections: [
      { id: 'title', title: 'Title & Recommendation', kind: 'deterministic' },
      { id: 'toc', title: 'Table of Contents', kind: 'deterministic' },
      { id: 'exec', title: 'Executive Summary & Recommendation', kind: 'narrative' },
      { id: 'property', title: 'Property Description', kind: 'deterministic' },
      { id: 'market', title: 'Market & Submarket Analysis', kind: 'deterministic' },
      { id: 'risk', title: 'Risk Factors & Mitigants', kind: 'deterministic' },
      { id: 'comps', title: 'Comparable Sales', kind: 'deterministic' },
      { id: 'financials', title: 'Financial Analysis (placeholder)', kind: 'deterministic' },
      { id: 'business_plan', title: 'Business Plan (placeholder)', kind: 'deterministic' },
      { id: 'exit', title: 'Exit Strategy (placeholder)', kind: 'deterministic' },
      { id: 'key_terms', title: 'Key Terms (placeholder)', kind: 'deterministic' },
      { id: 'exhibits', title: 'Exhibits', kind: 'deterministic' },
      { id: 'provenance', title: 'Sources & Provenance', kind: 'deterministic' },
    ],
    status: 'available',
  },

  monday_briefing_pdf: {
    id: 'monday_briefing_pdf',
    title: 'Monday Portfolio Briefing',
    cluster: 'cluster_5',
    homeTier: 'portfolio',
    scope: 'portfolio',
    requiredBlocks: ['flood', 'crime', 'hpi'],
    formats: ['pdf'],
    sections: [
      { id: 'cover', title: 'Cover', kind: 'deterministic' },
      { id: 'briefing', title: 'Weekly Briefing', kind: 'narrative' },
      { id: 'provenance', title: 'Sources & Provenance', kind: 'deterministic' },
    ],
    status: 'available',
  },

  portfolio_risk_report: {
    id: 'portfolio_risk_report',
    title: 'Portfolio Risk Report',
    cluster: 'cluster_5',
    homeTier: 'portfolio',
    scope: 'portfolio',
    requiredBlocks: ['flood', 'contamination', 'seismic', 'disaster_history', 'crime'],
    formats: ['pdf'],
    sections: [
      { id: 'cover', title: 'Cover', kind: 'deterministic' },
      { id: 'risk', title: 'Risk Exposure', kind: 'deterministic' },
      { id: 'provenance', title: 'Sources & Provenance', kind: 'deterministic' },
    ],
    // Phase 1 removed the representative-hazard blocker: its required blocks are
    // now all LIVE (federal EPA/USGS/FEMA + flood + crime). It remains BLOCKED
    // pending a wired builder/renderer (it is not in IMPLEMENTED_DOC_TYPES) — an
    // implementation gap, not a data gap. No `blockedOn` provider applies.
    status: 'blocked',
  },

  asset_one_pager: {
    id: 'asset_one_pager',
    title: 'Asset One-Pager',
    cluster: 'cluster_5',
    homeTier: 'portfolio',
    scope: 'property',
    requiredBlocks: ['zoning', 'mls_comps', 'hpi', 'flood', 'building_violations', 'opportunity_zone'],
    formats: ['pdf'],
    sections: [
      { id: 'verdict', title: 'Verdict', kind: 'deterministic' },
      { id: 'envelope', title: 'Property & Envelope', kind: 'deterministic' },
      { id: 'market', title: 'Key Market Indicators', kind: 'deterministic' },
      { id: 'risks', title: 'Top Risks', kind: 'deterministic' },
      { id: 'status', title: 'Current Status', kind: 'deterministic' },
      { id: 'provenance', title: 'Sources & Provenance', kind: 'deterministic' },
    ],
    status: 'available',
  },
};

// Lookup by id, or null for an unknown key (route returns a clean 404).
export function getDocumentType(id: string): DocumentType | null {
  return Object.prototype.hasOwnProperty.call(DOCUMENT_TYPES, id)
    ? DOCUMENT_TYPES[id]
    : null;
}
