// Single source of truth for which document types have a wired renderer and may
// be generated today. Both the /api/documents route (what it will actually
// build) and the disclaimer regression harness (what it must cover) import this,
// so "shippable" and "tested for the mandatory disclaimer" can never drift.
//
// Adding a type here without a corresponding sample model in
// lib/documents/render/samples.ts fails the disclaimer regression suite by
// design — a new document type cannot ship without disclaimer-on-every-page
// coverage.

export const IMPLEMENTED_DOC_TYPES = [
  'tax_appeal_packet',
  'property_intelligence_report',
  'violation_ownership_record',
  'permit_history_report',
  'site_screening_memo',
  'three_site_comparison_brief',
  'ic_memo',
  'monday_briefing_pdf',
  'asset_one_pager',
  'client_neighborhood_report',
  'pricing_recommendation_sheet',
  'buyer_seller_net_sheet',
  'entitlement_risk_memo',
  'cma',
] as const;

export type ImplementedDocType = (typeof IMPLEMENTED_DOC_TYPES)[number];

export const IMPLEMENTED_DOC_TYPE_SET: ReadonlySet<string> = new Set(IMPLEMENTED_DOC_TYPES);
