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
  // Optional (populated for the all_permits history, where the legacy DOB
  // Permit Issuance dataset carries an expiry): lets the Permit History Report
  // flag expired vs open permits. Absent on the 24-month recent_permits.
  expiration_date?: string | null;
  dataset?: 'DOB NOW' | 'DOB legacy'; // which source this record came from
}

export interface PermitsSummary {
  bin: string | null;
  scope_note: string; // what geography the counts cover
  total_permits_24mo: number;
  new_building_permits: number;
  demolition_permits: number;
  alteration_permits: number;
  recent_permits: PermitRecord[];
  // UI ONLY — never serialize into an agent prompt (same contract as
  // ViolationsSummary.all_items). The FULL subject-BBL permit history (all
  // available dates in DOB NOW, ≤300) for the chronological Permit History
  // Report. Empty is a coverage fact, not "no work ever" (see all_permits_note).
  all_permits: PermitRecord[];
  all_permits_note: string; // DOB NOW coverage caveat for the history report
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
  assessed_total_usd: number | null; // PLUTO assesstot — total assessed value (current roll)
  assessed_land_usd: number | null; // PLUTO assessland — land-only assessed value
  // City of Yes (PLUTO 26v1): base residential FAR is max_residential_far above;
  // affordable is the UAP affordable-housing maximum (a genuine decision input).
  max_affordable_residential_far: number | null; // PLUTO affresfar — City of Yes affordable-housing max residential FAR
  max_facility_far: number | null; // PLUTO facilfar — community facility FAR
  owner_name: string | null; // PLUTO ownername — as recorded (assemblage owner match)
  community_district: string | null; // PLUTO cd — e.g. "306" (Brooklyn CB6)
}

export interface ZoningProvider {
  name: string;
  getZoning(addr: ResolvedAddress): Promise<ProviderResult<ZoningInfo>>;
}

// ---------------------------------------------------------------------------
// Assemblage / air rights (block-level). NYC zoning lots and TDR (air-rights)
// transfers are constrained to a single tax block, so block-level ownership +
// unused FAR is the correct basis — not a spatial-adjacency approximation.
// ---------------------------------------------------------------------------

export interface AssemblageNeighbor {
  bbl: string;
  owner_name: string | null;
  lot_area_sqft: number | null;
  building_area_sqft: number | null;
  unused_far_floor_area_sqft: number | null; // max(0, residfar*lotarea − bldgarea)
  same_owner_as_subject: boolean;
}

export interface AssemblageSummary {
  subject_bbl: string | null;
  subject_owner_name: string | null;
  block_lot_count: number; // lots on the tax block (incl. subject)
  same_owner_lot_count: number; // OTHER lots on the block held by the subject's owner
  same_owner_bbls: string[];
  block_unused_far_floor_area_sqft: number; // sum over OTHER lots on the block
  same_owner_unused_far_floor_area_sqft: number; // sum over same-owner OTHER lots
  block_note: string; // the block-level rule, always present
  // UI ONLY — same contract as recent_items: never into an agent prompt.
  neighbors: AssemblageNeighbor[];
}

export interface AssemblageProvider {
  name: string;
  getAssemblage(addr: ResolvedAddress): Promise<ProviderResult<AssemblageSummary>>;
}

// ---------------------------------------------------------------------------
// Entitlement track record — DOB Job Application Filings (ic3t-wcy2, legacy
// BIS). The highest-risk development stage: not "what can I build" but "will I
// get to build it." Subject-lot filings + the community district's disposition
// track record (denials, withdrawals, stalls) and a typical filing timeline.
// ---------------------------------------------------------------------------

export interface EntitlementFilingItem {
  job: string;
  job_type: string; // NB, A1, A2, DM, ...
  status: string; // job_status_descrp
  latest_action_date: string | null; // as recorded (MM/DD/YYYY)
}

export interface EntitlementSummary {
  subject_bbl: string | null;
  community_district: string | null; // "306"
  subject_filing_count: number;
  cd_total_filings: number;
  cd_approved: number; // reached approval / permit / sign-off
  cd_disapproved: number; // PLAN EXAM - DISAPPROVED
  cd_withdrawn: number;
  cd_suspended: number;
  cd_in_process: number; // in plan exam / assigned / pre-filing
  cd_approval_ratio_pct: number | null; // approved / (approved + disapproved)
  cd_median_timeline_days: number | null; // median pre-filing → latest action for advanced filings
  scope_note: string; // dataset + interpretation caveat, always present
  // UI ONLY — same contract as recent_items: never into an agent prompt.
  subject_recent_items: EntitlementFilingItem[];
}

export interface EntitlementProvider {
  name: string;
  getEntitlement(addr: ResolvedAddress): Promise<ProviderResult<EntitlementSummary>>;
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

// ---------------------------------------------------------------------------
// Environmental & climate hazard (federal, NATIONAL, live free sources).
// These re-base the Risk & Volatility agent onto authoritative federal data so
// hazard is genuinely live at any US address — replacing the premium-hazard
// mock (Verisk/CoreLogic stand-in). They COMPLEMENT the FEMA NFHL flood provider
// (which is the regulatory flood-zone TODAY): this is broader forward-looking and
// historical hazard, not the same signal.
// ---------------------------------------------------------------------------

// EPA — Superfund (SEMS/NPL) + brownfield (ACRES) proximity via the Facility
// Registry Service radius query. Gives the Risk agent a REAL contamination-
// proximity datapoint (closing the hallucinated-Superfund gap: the agent no
// longer guesses a site from a coded field — it is handed the actual sites).
export interface ContaminationInfo {
  radius_mi: number; // the search radius used
  superfund_sites_within_radius: number; // SEMS (Superfund program) sites — NPL and non-NPL
  brownfield_within_radius: number; // ACRES brownfield sites
  total_cleanup_sites_within_radius: number;
  nearest_site_name: string | null;
  nearest_site_distance_mi: number | null;
  nearest_site_program: string | null; // "SEMS (Superfund)" | "ACRES (brownfield)"
  scope_note: string;
}

export interface ContaminationProvider {
  name: string;
  getContamination(addr: ResolvedAddress): Promise<ProviderResult<ContaminationInfo>>;
}

// USGS — seismic design values (from the building-codes service) + a count of
// historical earthquakes near the point (FDSN ComCat). Modeled hazard, not a
// live event feed.
export interface SeismicInfo {
  pga_g: number | null; // mapped peak ground acceleration (g)
  ss_g: number | null; // 0.2s spectral response acceleration (g)
  s1_g: number | null; // 1.0s spectral response acceleration (g)
  design_reference: string; // e.g. "ASCE 7-22, Site Class D (default)"
  historical_quakes_50km_m3plus: number | null; // count, ~since 1970
  largest_nearby_magnitude: number | null;
  scope_note: string;
}

export interface SeismicProvider {
  name: string;
  getSeismic(addr: ResolvedAddress): Promise<ProviderResult<SeismicInfo>>;
}

// OpenFEMA — federally-declared disaster HISTORY for the county (multi-peril,
// historical frequency). Explicitly complements NFHL: not a regulatory zone, but
// how often this county has actually been declared a disaster and for what.
export interface DisasterHistoryInfo {
  fips_state: string | null;
  fips_county: string | null;
  total_declarations: number;
  declarations_last_10yr: number;
  distinct_incident_types: string[]; // e.g. ["Flood","Severe Storm","Hurricane"]
  most_common_incident: string | null;
  most_recent_declaration: string | null; // "2024-01 — Severe Storm"
  scope_note: string; // INCLUDES the mandatory FEMA non-endorsement disclaimer
}

export interface DisasterHistoryProvider {
  name: string;
  getDisasterHistory(addr: ResolvedAddress): Promise<ProviderResult<DisasterHistoryInfo>>;
}

// NOAA NCEI — climate normals (1991–2020) for the nearest station. Requires a
// free NOAA_CDO_TOKEN; when unset the provider returns data:null tagged `live`
// (a coverage absence, NOT representative) so it never drags the verdict.
export interface ClimateInfo {
  station_id: string | null;
  station_name: string | null;
  normals_period: string; // "1991-2020"
  annual_avg_temp_f: number | null;
  annual_precip_in: number | null;
  scope_note: string;
}

export interface ClimateProvider {
  name: string;
  getClimate(addr: ResolvedAddress): Promise<ProviderResult<ClimateInfo>>;
}

// ---------------------------------------------------------------------------
// Housing demand (federal, NATIONAL, live free sources). These re-base the
// Demand-Sentiment agent off foot-traffic + search-interest mocks onto genuine
// housing-demand signals that work at any US address: mortgage lending (CFPB
// HMDA), employment/wages (BLS QCEW), and who is moving in/out with what income
// (IRS SOI migration). Better demand signals than pedestrian counts.
// ---------------------------------------------------------------------------

// CFPB HMDA — mortgage applications / originations / denials for the county.
// A live, keyless aggregations API. County grain in Phase 1 (tract-level via the
// raw modified-LAR is a planned fast-follow ingestion).
export interface MortgageDemandInfo {
  year: number;
  originations: number;
  denials: number;
  denial_rate_pct: number | null; // denials / (originations + denials) — decisioned-denial rate
  originations_yoy_pct: number | null; // vs prior year (loan-demand momentum)
  scope_note: string;
}

export interface MortgageDemandProvider {
  name: string;
  getMortgageDemand(addr: ResolvedAddress): Promise<ProviderResult<MortgageDemandInfo>>;
}

// BLS QCEW — county employment level, average weekly wage, and their year-over-
// year change (the CSV carries the over-the-year deltas directly).
export interface EmploymentInfo {
  period: string; // e.g. "2024 Q4"
  total_employment: number | null;
  avg_weekly_wage_usd: number | null;
  employment_yoy_pct: number | null;
  avg_weekly_wage_yoy_pct: number | null;
  establishments: number | null;
  scope_note: string;
}

export interface EmploymentProvider {
  name: string;
  getEmployment(addr: ResolvedAddress): Promise<ProviderResult<EmploymentInfo>>;
}

// IRS SOI county-to-county migration + AGI. No live API — bulk files only — so
// this reads a SELF-HOSTED table (ingested once from the annual IRS CSVs). Tagged
// `live` with an explicit vintage (like ACS/FHFA: authoritative, periodic). When
// the table is unseeded the provider returns data:null tagged `live` (coverage
// absence, not representative), so demand stays live on HMDA + QCEW alone.
export interface MigrationInfo {
  vintage: string; // e.g. "IRS SOI 2021→2022"
  inflow_returns: number | null; // households moving IN (n1)
  outflow_returns: number | null; // households moving OUT
  net_migration_returns: number | null; // inflow − outflow
  inflow_agi_per_return_usd: number | null; // avg income of in-movers
  outflow_agi_per_return_usd: number | null; // avg income of out-movers
  scope_note: string;
}

export interface MigrationProvider {
  name: string;
  getMigration(addr: ResolvedAddress): Promise<ProviderResult<MigrationInfo>>;
}

// ---------------------------------------------------------------------------
// Market supplements (federal / free) feeding the Market-Timing agent. Additive
// enrichment — both degrade without dragging: HUD FMR omits when its free token
// is unset; the mortgage rate falls back to representative only on a live-call
// failure.
// ---------------------------------------------------------------------------

// HUD Fair Market Rents — rent benchmark by bedroom for the county/metro. Needs
// a free HUD_USER_TOKEN (bearer). When unset the provider returns data:null
// tagged `live` (coverage absence, not representative).
export interface FairMarketRentInfo {
  area_name: string | null;
  fiscal_year: string;
  fmr_studio: number | null;
  fmr_1br: number | null;
  fmr_2br: number | null;
  fmr_3br: number | null;
  fmr_4br: number | null;
  scope_note: string;
}

export interface FairMarketRentProvider {
  name: string;
  getFairMarketRent(addr: ResolvedAddress): Promise<ProviderResult<FairMarketRentInfo>>;
}

// Mortgage rate (Freddie Mac PMMS) — NATIONAL 30/15-yr weekly average, pulled
// DIRECTLY from Freddie Mac's published CSV (attribution-only), NOT redistributed
// via FRED (whose PMMS series is copyright-restricted for commercial use).
export interface MortgageRateInfo {
  week: string; // as published, e.g. "8/13/2026"
  rate_30yr_pct: number | null;
  rate_15yr_pct: number | null;
  scope_note: string;
}

export interface MortgageRateProvider {
  name: string;
  getMortgageRate(addr: ResolvedAddress): Promise<ProviderResult<MortgageRateInfo>>;
}

// ---------------------------------------------------------------------------
// Building violations (HPD + ECB + DOB complaints) — live NYC Open Data
// ---------------------------------------------------------------------------

export interface ViolationRecentItem {
  source: 'HPD' | 'ECB' | 'DOB';
  date: string; // ISO yyyy-mm-dd
  label: string; // class/severity/category + short description
  status: string;
  violation_id: string | null; // HPD violationid / ECB violation number — citable in documents
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
  // UI ONLY — never serialize these into an agent prompt. Agents get the summary
  // counts above; raw rows would 10x the token cost per run.
  recent_items: ViolationRecentItem[]; // short preview for dashboard panels
  all_items: ViolationRecentItem[]; // FULL list (HPD+ECB+DOB, ≤250) for the evidentiary Violation & Ownership Record
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
  registered_owner_address: string | null; // owner's registered business mailing address (letter addressee)
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

// Comparable sales — LIVE from NYC recorded sales (DOF Rolling Sales).
// Recorded sales carry price, date, and gross square feet, so $/sq ft is
// per-comp real. They do NOT carry days-on-market (an MLS concept, and MLS is
// the paid source we do not access) — so this contract exposes price MOVEMENT
// over time (price_trend), which is what recorded sales honestly provide,
// rather than fabricated DOM zeros.
export interface MlsComp {
  address: string;
  sale_price: number;
  sale_date: string;
  price_per_sqft: number;
  gross_square_feet: number;
  building_class: string;
  distance_mi: number | null; // true distance from subject (DOF BBL → PLUTO centroid); null on ZIP fallback
}

export interface MlsCompsSummary {
  comps: MlsComp[];
  median_price_per_sqft: number;
  sales_count: number; // qualifying recorded sales in scope
  price_trend: 'rising' | 'falling' | 'flat'; // recent vs prior period median $/sqft
  scope_note: string; // coverage + proximity honesty (ZIP-keyed, NYC-only, etc.)
}

export interface MlsCompsProvider {
  name: string;
  getComps(addr: ResolvedAddress): Promise<ProviderResult<MlsCompsSummary>>;
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
