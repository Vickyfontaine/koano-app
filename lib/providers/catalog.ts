// Provider catalog — the ONE display manifest for every data source KOANO uses,
// keyed to the registry so the marketing /data page can never again list a source
// that does not exist (the pre-Phase-1 /data page hand-maintained ~45 vendors, of
// which all but two were never integrated, a Principle 2 violation on the page
// whose whole job is transparency).
//
// THE STRUCTURAL GUARANTEE: PROVIDER_CATALOG is typed `Record<keyof ProviderRegistry,
// ...>`. Add a provider to registry.ts and this file fails to compile until you
// describe it here; list a provider that isn't in the registry and it fails too.
// The build gate (next build) therefore keeps the page and the real provider set
// in lockstep. There is no hand-maintained list to drift.
//
// Client-safe: imports ONLY the ProviderRegistry type (erased at build), so the
// client-rendered DataContent can consume it with no provider runtime pulled in.

import type { ProviderRegistry } from './registry';

// Source families for the /data page. Named categories read as a wide net without
// a count to argue with, and they stay true as the underlying list grows. Ordered
// local-first, then national.
export const LIVE_SOURCE_GROUP_ORDER = [
  'Municipal building records',
  'Parcel, zoning and ownership',
  'Recorded sales',
  'Environmental contamination',
  'Federal hazard and climate',
  'Crime statistics',
  'Mortgage and lending activity',
  'Employment and migration',
  'Prices, demographics and housing policy',
] as const;

export type SourceGroup = (typeof LIVE_SOURCE_GROUP_ORDER)[number];

export interface ProviderCatalogEntry {
  /** Human-readable source, matching the provider's runtime `source` field. */
  source: string;
  /** Short category shown as the mono sub-label. */
  category: string;
  /** Named family this source belongs to on the /data page. */
  group: SourceGroup;
  /** Geographic reach of the LIVE data this provider returns. */
  coverage: 'national' | 'nyc';
  /**
   * The provider's STEADY-STATE provenance: what it returns on a successful call.
   * `live` = KOANO queried an authoritative public source; `representative` = a
   * deliberate stand-in for an unfunded paid source. (The transient states
   * fetch_failed / coverage_absent are runtime outcomes, not catalog facts.)
   */
  provenance: 'live' | 'representative';
  /** Which part of the engine consumes it, to orient the reader. */
  usedBy: string;
  /** For representative providers only: the one-line change that makes it live. */
  swapNote?: string;
}

export const PROVIDER_CATALOG: Record<keyof ProviderRegistry, ProviderCatalogEntry> = {
  geocode: {
    source: 'NYC GeoSearch + US Census geocoder',
    category: 'Address resolution',
    group: 'Parcel, zoning and ownership',
    coverage: 'national',
    provenance: 'live',
    usedBy: 'Every verdict',
  },
  geometry: {
    source: 'US Census TIGERweb + NYC DCP MapPLUTO',
    category: 'Parcel & tract geometry',
    group: 'Parcel, zoning and ownership',
    coverage: 'national',
    provenance: 'live',
    usedBy: 'Maps and comp distance ranking',
  },
  permits: {
    source: 'NYC DOB NOW Approved Permits',
    category: 'Building permits',
    group: 'Municipal building records',
    coverage: 'nyc',
    provenance: 'live',
    usedBy: 'Infrastructure pipeline agent',
  },
  buildingViolations: {
    source: 'NYC HPD / ECB / DOB violations',
    category: 'Building violations',
    group: 'Municipal building records',
    coverage: 'nyc',
    provenance: 'live',
    usedBy: 'Risk and regulatory agents',
  },
  entitlement: {
    source: 'NYC DOB Job Application Filings',
    category: 'Entitlement filings',
    group: 'Municipal building records',
    coverage: 'nyc',
    provenance: 'live',
    usedBy: 'Regulatory and policy agent',
  },
  zoning: {
    source: 'NYC MapPLUTO',
    category: 'Zoning & land use',
    group: 'Parcel, zoning and ownership',
    coverage: 'nyc',
    provenance: 'live',
    usedBy: 'Regulatory and policy agent',
  },
  assemblage: {
    source: 'NYC MapPLUTO block ownership and unused FAR',
    category: 'Assemblage',
    group: 'Parcel, zoning and ownership',
    coverage: 'nyc',
    provenance: 'live',
    usedBy: 'Development analysis',
  },
  landlordPortfolio: {
    source: 'NYC HPD registrations + Speculation Watch List',
    category: 'Ownership records',
    group: 'Parcel, zoning and ownership',
    coverage: 'nyc',
    provenance: 'live',
    usedBy: 'Regulatory and policy agent',
  },
  mlsComps: {
    source: 'NYC DOF Rolling Sales',
    category: 'Comparable sales',
    group: 'Recorded sales',
    coverage: 'nyc',
    provenance: 'live',
    usedBy: 'Market timing agent and CMA',
  },
  contamination: {
    source: 'EPA Facility Registry Service (Superfund + brownfields)',
    category: 'Environmental',
    group: 'Environmental contamination',
    coverage: 'national',
    provenance: 'live',
    usedBy: 'Risk and volatility agent',
  },
  flood: {
    source: 'FEMA National Flood Hazard Layer',
    category: 'Flood risk',
    group: 'Federal hazard and climate',
    coverage: 'national',
    provenance: 'live',
    usedBy: 'Risk and volatility agent',
  },
  seismic: {
    source: 'USGS Earthquake Hazards (ASCE 7-22 + ComCat)',
    category: 'Seismic',
    group: 'Federal hazard and climate',
    coverage: 'national',
    provenance: 'live',
    usedBy: 'Risk and volatility agent',
  },
  disasterHistory: {
    source: 'OpenFEMA Disaster Declarations',
    category: 'Disaster history',
    group: 'Federal hazard and climate',
    coverage: 'national',
    provenance: 'live',
    usedBy: 'Risk and volatility agent',
  },
  climate: {
    source: 'NOAA NCEI climate normals',
    category: 'Climate',
    group: 'Federal hazard and climate',
    coverage: 'national',
    provenance: 'live',
    usedBy: 'Risk and volatility agent',
  },
  nationalRisk: {
    source: 'FEMA National Risk Index',
    category: 'Hazard composite',
    group: 'Federal hazard and climate',
    coverage: 'national',
    provenance: 'live',
    usedBy: 'Risk and volatility agent',
  },
  crime: {
    source: 'FBI Crime Data Explorer / NYPD complaints',
    category: 'Crime',
    group: 'Crime statistics',
    coverage: 'national',
    provenance: 'live',
    usedBy: 'Risk and volatility agent',
  },
  mortgageDemand: {
    source: 'CFPB HMDA',
    category: 'Mortgage lending',
    group: 'Mortgage and lending activity',
    coverage: 'national',
    provenance: 'live',
    usedBy: 'Demand sentiment agent',
  },
  mortgageRate: {
    source: 'Freddie Mac PMMS',
    category: 'Mortgage rates',
    group: 'Mortgage and lending activity',
    coverage: 'national',
    provenance: 'live',
    usedBy: 'Market timing agent',
  },
  employment: {
    source: 'BLS QCEW',
    category: 'Employment & wages',
    group: 'Employment and migration',
    coverage: 'national',
    provenance: 'live',
    usedBy: 'Demand sentiment agent',
  },
  migration: {
    source: 'IRS SOI county-to-county migration',
    category: 'Migration',
    group: 'Employment and migration',
    coverage: 'national',
    provenance: 'live',
    usedBy: 'Demand sentiment agent',
  },
  demographics: {
    source: 'US Census ACS 5-year',
    category: 'Demographics',
    group: 'Prices, demographics and housing policy',
    coverage: 'national',
    provenance: 'live',
    usedBy: 'Demand and market agents',
  },
  hpi: {
    source: 'FHFA House Price Index',
    category: 'Price indices',
    group: 'Prices, demographics and housing policy',
    coverage: 'national',
    provenance: 'live',
    usedBy: 'Market timing agent',
  },
  opportunityZones: {
    source: 'IRS / Treasury Opportunity Zone designations',
    category: 'Tax policy',
    group: 'Prices, demographics and housing policy',
    coverage: 'national',
    provenance: 'live',
    usedBy: 'Regulatory and policy agent',
  },
  lihtcEligibility: {
    source: 'HUD QCT + DDA',
    category: 'Housing policy',
    group: 'Prices, demographics and housing policy',
    coverage: 'national',
    provenance: 'live',
    usedBy: 'Regulatory and policy agent',
  },
  fairMarketRent: {
    source: 'HUD Fair Market Rents',
    category: 'Rents',
    group: 'Prices, demographics and housing policy',
    coverage: 'national',
    provenance: 'live',
    usedBy: 'Market timing agent',
  },
  buildingPermitsSupply: {
    source: 'Census Building Permits Survey',
    category: 'New-supply context',
    group: 'Prices, demographics and housing policy',
    coverage: 'national',
    provenance: 'live',
    usedBy: 'Market timing agent',
  },
  proformaBenchmark: {
    source: 'Pro-forma benchmarks',
    category: 'Land & construction costs',
    group: 'Prices, demographics and housing policy',
    coverage: 'national',
    provenance: 'representative',
    usedBy: 'Development documents',
    swapNote:
      'Becomes live with a CoStar Market Analytics or HouseCanary license. A one-line change in the provider registry.',
  },
  costarDeals: {
    source: 'Institutional comparable deals',
    category: 'Commercial transactions',
    group: 'Recorded sales',
    coverage: 'national',
    provenance: 'representative',
    usedBy: 'Portfolio documents',
    swapNote:
      'Becomes live with a CoStar/LoopNet or MSCI Real Capital Analytics license. A one-line change in the provider registry.',
  },
};

// Derived views for the /data page, computed from the catalog and never hand-kept.
const CATALOG_ENTRIES: ProviderCatalogEntry[] = Object.values(PROVIDER_CATALOG);
export const LIVE_SOURCES = CATALOG_ENTRIES.filter((e) => e.provenance === 'live');
export const REPRESENTATIVE_SOURCES = CATALOG_ENTRIES.filter(
  (e) => e.provenance === 'representative',
);

// Live sources grouped into named families, in display order, empty groups dropped.
export const LIVE_SOURCE_GROUPS = LIVE_SOURCE_GROUP_ORDER.map((group) => ({
  group,
  entries: LIVE_SOURCES.filter((e) => e.group === group),
})).filter((g) => g.entries.length > 0);
