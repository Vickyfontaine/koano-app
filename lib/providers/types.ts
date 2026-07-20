// KOANO provider architecture — Phase A backend spine
// Every provider method returns ProviderResult<T>.
// provenance: "live" = fetched from the real external source at call time.
// provenance: "representative" = labeled stand-in data (mock provider, or a
// live call that failed and fell back). NEVER a silent fake.

export type Provenance = 'live' | 'representative';

export interface ProviderResult<T> {
  ok: boolean;
  data: T | null;
  provenance: Provenance;
  source: string; // human-readable source name, e.g. "NYC Open Data — DOB Permit Issuance"
  endpoint?: string; // the URL actually hit (or attempted)
  fetched_at: string; // ISO timestamp
  error?: string; // populated when a live call failed (and we fell back)
  swap_note?: string; // mock providers only: exact paid source + registry change to go live
}

// A single provenance-tagged fact, as consumed by agents.
export interface DataPoint<T = string | number | boolean | null> {
  label: string;
  value: T;
  provenance: Provenance;
  source: string;
}

// ---------------------------------------------------------------------------
// Geocoding / address resolution
// ---------------------------------------------------------------------------

export interface ResolvedAddress {
  input: string;
  normalized: string;
  latitude: number;
  longitude: number;
  borough: string | null;
  bbl: string | null; // NYC borough-block-lot
  bin: string | null; // NYC building identification number
  zip: string | null;
  state_fips: string | null;
  county_fips: string | null;
  tract_code: string | null; // 6-digit census tract
  tract_geoid: string | null; // 11-digit GEOID (state+county+tract)
}

export interface GeocodeProvider {
  name: string;
  resolve(address: string): Promise<ProviderResult<ResolvedAddress>>;
}

// ---------------------------------------------------------------------------
// Real free-source domains
// ---------------------------------------------------------------------------

export interface PermitRecord {
  job_type: string;
  work_type: string | null;
  permit_status: string | null;
  issuance_date: string;
  address: string;
  borough: string;
}

export interface PermitsSummary {
  bin: string | null;
  scope_note: string; // what geography the counts cover
  total_permits_24mo: number;
  new_building_permits: number;
  demolition_permits: number;
  alteration_permits: number;
  recent_permits: PermitRecord[];
}

export interface PermitsProvider {
  name: string;
  getPermits(addr: ResolvedAddress): Promise<ProviderResult<PermitsSummary>>;
}

export interface ZoningInfo {
  bbl: string;
  zoning_district: string | null;
  commercial_overlay: string | null;
  special_district: string | null;
  land_use_code: string | null;
  building_class: string | null;
  lot_area_sqft: number | null;
  building_area_sqft: number | null;
  built_far: number | null;
  max_residential_far: number | null;
  max_commercial_far: number | null;
  unused_far_pct: number | null; // development headroom
  year_built: number | null;
  residential_units: number | null;
}

export interface ZoningProvider {
  name: string;
  getZoning(addr: ResolvedAddress): Promise<ProviderResult<ZoningInfo>>;
}

export interface OpportunityZoneInfo {
  tract_geoid: string;
  is_opportunity_zone: boolean;
  designation_note: string | null;
}

export interface OpportunityZoneProvider {
  name: string;
  getOpportunityZone(addr: ResolvedAddress): Promise<ProviderResult<OpportunityZoneInfo>>;
}

export interface AcsDemographics {
  tract_geoid: string;
  tract_name: string | null;
  population: number | null;
  median_household_income: number | null;
  median_gross_rent: number | null;
  median_home_value: number | null;
  bachelors_or_higher_pct: number | null;
  vintage: string; // e.g. "ACS 5-year 2023"
}

export interface DemographicsProvider {
  name: string;
  getDemographics(addr: ResolvedAddress): Promise<ProviderResult<AcsDemographics>>;
}

export interface HpiTrend {
  region: string;
  region_type: string; // e.g. "MSA"
  latest_period: string; // e.g. "2025 Q1"
  latest_index: number;
  yoy_change_pct: number | null;
  five_yr_change_pct: number | null;
}

export interface HpiProvider {
  name: string;
  getHpi(addr: ResolvedAddress): Promise<ProviderResult<HpiTrend>>;
}

export interface FloodInfo {
  flood_zone: string | null; // e.g. "AE", "X"
  zone_subtype: string | null;
  in_special_flood_hazard_area: boolean;
  static_bfe_ft: number | null;
}

export interface FloodProvider {
  name: string;
  getFloodZone(addr: ResolvedAddress): Promise<ProviderResult<FloodInfo>>;
}

export interface CrimeStats {
  jurisdiction: string;
  period: string;
  violent_incidents: number | null;
  property_incidents: number | null;
  total_incidents: number | null;
  rate_note: string; // what the counts are normalized to / cover
  trend: 'rising' | 'falling' | 'flat' | 'unknown';
}

export interface CrimeProvider {
  name: string;
  getCrimeStats(addr: ResolvedAddress): Promise<ProviderResult<CrimeStats>>;
}

export interface SearchTrendsInfo {
  term: string;
  geo: string;
  interest_current: number; // 0–100
  interest_12mo_avg: number; // 0–100
  momentum: 'rising' | 'falling' | 'flat';
}

export interface SearchTrendsProvider {
  name: string;
  getSearchTrends(addr: ResolvedAddress): Promise<ProviderResult<SearchTrendsInfo>>;
}

// ---------------------------------------------------------------------------
// Building violations (HPD + ECB + DOB complaints) — live NYC Open Data
// ---------------------------------------------------------------------------

export interface ViolationRecentItem {
  source: 'HPD' | 'ECB' | 'DOB';
  date: string; // ISO yyyy-mm-dd
  label: string; // class/severity/category + short description
  status: string;
}

export interface BuildingViolationsSummary {
  bbl: string | null;
  bin: string | null;
  scope_note: string;
  // HPD covers only registered multiple dwellings (3+ residential units).
  // hpd_registered=false means zeros are a coverage fact, not a clean bill.
  hpd_registered: boolean;
  hpd: {
    total: number;
    open: number;
    open_by_class: Record<'A' | 'B' | 'C' | 'I', number>;
    last_24mo: number;
    prior_24mo: number; // vs last_24mo → recency trend
    most_recent_inspection: string | null;
  };
  ecb: {
    total: number;
    active: number;
    active_by_severity: Record<string, number>;
    most_recent_issue: string | null;
  };
  dob_complaints: {
    total: number;
    active: number;
    last_24mo: number;
    most_recent: string | null;
    top_categories: string[]; // DOB category codes
  };
  // UI ONLY — never serialize recent_items into an agent prompt. Agents get
  // the summary counts above; raw rows would 10x the token cost per run.
  recent_items: ViolationRecentItem[];
}

export interface BuildingViolationsProvider {
  name: string;
  getViolations(addr: ResolvedAddress): Promise<ProviderResult<BuildingViolationsSummary>>;
}

// ---------------------------------------------------------------------------
// Landlord portfolio (HPD registrations/contacts + Speculation Watch List)
// v1 is EXACT entity matching only (uppercase/trim) — no fuzzy matching, no
// LLC-variant resolution. Portfolios are therefore an undercount and every
// summary says so. This is ownership records, not harassment/eviction data.
// ---------------------------------------------------------------------------

export interface PortfolioBuilding {
  bbl: string | null;
  address: string;
  zip: string | null;
  open_hpd_violations: number;
}

export interface LandlordPortfolioSummary {
  subject_bbl: string | null;
  hpd_registered: boolean;
  registered_owner: string | null; // corporation or individual, exact as registered
  owner_type: string | null; // CorporateOwner | IndividualOwner | HeadOfficer...
  management_company: string | null; // Agent contact, if any
  portfolio_building_count: number; // distinct buildings under exact-match entity
  portfolio_truncated: boolean; // true when caps applied — never a silent cap
  portfolio_open_hpd_violations: number;
  portfolio_total_hpd_violations: number;
  on_speculation_watch_list: boolean;
  match_caveat: string; // exact-match undercount disclosure, always present
  // UI ONLY — same contract as recent_items: never into an agent prompt.
  buildings: PortfolioBuilding[];
}

export interface LandlordPortfolioProvider {
  name: string;
  getPortfolio(addr: ResolvedAddress): Promise<ProviderResult<LandlordPortfolioSummary>>;
}

// ---------------------------------------------------------------------------
// Representative (mock) domains — paid sources, swapped in later (Step 3)
// ---------------------------------------------------------------------------

export interface ProformaBenchmark {
  submarket: string;
  land_cost_per_buildable_sf: number;
  construction_cost_per_sf: number;
  exit_cap_rate_pct: number;
  absorption_units_per_month: number;
}

export interface ProformaBenchmarkProvider {
  name: string;
  getBenchmarks(addr: ResolvedAddress): Promise<ProviderResult<ProformaBenchmark>>;
}

export interface MlsComp {
  address: string;
  sale_price: number;
  sale_date: string;
  days_on_market: number;
  price_per_sqft: number;
}

export interface MlsCompsSummary {
  comps: MlsComp[];
  median_dom: number;
  median_price_per_sqft: number;
  dom_trend: 'compressing' | 'expanding' | 'flat';
}

export interface MlsCompsProvider {
  name: string;
  getComps(addr: ResolvedAddress): Promise<ProviderResult<MlsCompsSummary>>;
}

export interface FootTrafficInfo {
  area: string;
  monthly_visits: number;
  yoy_change_pct: number;
  weekend_share_pct: number;
}

export interface FootTrafficProvider {
  name: string;
  getFootTraffic(addr: ResolvedAddress): Promise<ProviderResult<FootTrafficInfo>>;
}

export interface PremiumHazardInfo {
  flood_factor_1_to_10: number;
  fire_factor_1_to_10: number;
  heat_factor_1_to_10: number;
  thirty_yr_flood_probability_pct: number;
}

export interface PremiumHazardProvider {
  name: string;
  getHazards(addr: ResolvedAddress): Promise<ProviderResult<PremiumHazardInfo>>;
}

export interface CostarDeal {
  property_type: string;
  sale_price: number;
  cap_rate_pct: number;
  sale_date: string;
  submarket: string;
}

export interface CostarDealsSummary {
  deals: CostarDeal[];
  median_cap_rate_pct: number;
  transaction_volume_yoy_pct: number;
}

export interface CostarDealsProvider {
  name: string;
  getDeals(addr: ResolvedAddress): Promise<ProviderResult<CostarDealsSummary>>;
}
