// Provider registry — maps each provider interface to exactly ONE active
// implementation. Swapping a representative provider for a live paid source is
// a one-line change here (see each mock provider's swap_note).

import type {
  AssemblageProvider,
  BuildingPermitsProvider,
  BuildingViolationsProvider,
  ClimateProvider,
  ContaminationProvider,
  CostarDealsProvider,
  CrimeProvider,
  DisasterHistoryProvider,
  EmploymentProvider,
  EntitlementProvider,
  FairMarketRentProvider,
  LandlordPortfolioProvider,
  LihtcEligibilityProvider,
  DemographicsProvider,
  FloodProvider,
  GeocodeProvider,
  HpiProvider,
  MigrationProvider,
  MlsCompsProvider,
  GeometryProvider,
  MortgageDemandProvider,
  MortgageRateProvider,
  NationalRiskProvider,
  OpportunityZoneProvider,
  PermitsProvider,
  SeismicProvider,
  ProformaBenchmarkProvider,
  ZoningProvider,
} from './types';

import { nycGeoSearch } from './real/geocode';
import { nycLandlord } from './real/nyc-landlord';
import { nycPermits } from './real/nyc-permits';
import { nycViolations } from './real/nyc-violations';
import { nycZoning } from './real/nyc-zoning';
import { nycAssemblage } from './real/nyc-assemblage';
import { nycDobFilings } from './real/nyc-dob-filings';
import { irsOpportunity } from './real/irs-opportunity';
import { nycGeometry } from './real/nyc-geometry';
import { censusAcs } from './real/census-acs';
import { fhfaHpi } from './real/fhfa-hpi';
import { femaFlood } from './real/fema-flood';
import { fbiUcr } from './real/fbi-ucr';
import { epaContamination } from './real/epa-superfund';
import { femaNri } from './real/fema-nri';
import { hudQctDda } from './real/hud-qct-dda';
import { censusBps } from './real/census-bps';
import { usgsSeismic } from './real/usgs-seismic';
import { openFemaDisasters } from './real/openfema-disasters';
import { noaaClimate } from './real/noaa-climate';
import { cfpbHmda } from './real/cfpb-hmda';
import { blsQcew } from './real/bls-qcew';
import { irsMigration } from './real/irs-migration';
import { hudFmr } from './real/hud-fmr';
import { freddiePmms } from './real/freddie-pmms';
import { mockProformaBenchmark } from './mock/proforma-benchmark';
import { nycSalesComps } from './real/nyc-sales';
import { mockCostarDeals } from './mock/costar-deals';

export interface ProviderRegistry {
  // live (free) providers
  geocode: GeocodeProvider;
  permits: PermitsProvider;
  buildingViolations: BuildingViolationsProvider;
  landlordPortfolio: LandlordPortfolioProvider;
  zoning: ZoningProvider;
  opportunityZones: OpportunityZoneProvider;
  lihtcEligibility: LihtcEligibilityProvider;
  geometry: GeometryProvider;
  demographics: DemographicsProvider;
  hpi: HpiProvider;
  flood: FloodProvider;
  crime: CrimeProvider;
  assemblage: AssemblageProvider;
  entitlement: EntitlementProvider;
  // environmental & climate hazard — federal, national, live free (re-base of
  // the former premium-hazard mock)
  contamination: ContaminationProvider;
  seismic: SeismicProvider;
  disasterHistory: DisasterHistoryProvider;
  climate: ClimateProvider;
  nationalRisk: NationalRiskProvider;
  // housing demand — federal, national, live free (re-base of foot-traffic +
  // search-interest mocks)
  mortgageDemand: MortgageDemandProvider;
  employment: EmploymentProvider;
  migration: MigrationProvider;
  // market supplements (federal / free) feeding Market-Timing
  fairMarketRent: FairMarketRentProvider;
  mortgageRate: MortgageRateProvider;
  buildingPermitsSupply: BuildingPermitsProvider;
  // representative providers — see each mock's swap_note for the live upgrade
  proformaBenchmark: ProformaBenchmarkProvider;
  mlsComps: MlsCompsProvider;
  costarDeals: CostarDealsProvider;
}

export const registry: ProviderRegistry = {
  geocode: nycGeoSearch,
  permits: nycPermits,
  buildingViolations: nycViolations,
  landlordPortfolio: nycLandlord,
  zoning: nycZoning,
  opportunityZones: irsOpportunity,
  lihtcEligibility: hudQctDda,
  geometry: nycGeometry,
  demographics: censusAcs,
  hpi: fhfaHpi,
  flood: femaFlood,
  crime: fbiUcr,
  assemblage: nycAssemblage,
  entitlement: nycDobFilings,
  // environmental & climate hazard — LIVE federal (was mock/premium-hazard.ts)
  contamination: epaContamination,
  seismic: usgsSeismic,
  disasterHistory: openFemaDisasters,
  climate: noaaClimate,
  nationalRisk: femaNri,
  // housing demand — LIVE federal (re-base of foot-traffic + search-interest)
  mortgageDemand: cfpbHmda,
  employment: blsQcew,
  migration: irsMigration,
  // market supplements — LIVE federal/free feeding Market-Timing
  fairMarketRent: hudFmr,
  mortgageRate: freddiePmms,
  buildingPermitsSupply: censusBps,
  // representative (mock) providers — one-line swap to live per swap_note
  proformaBenchmark: mockProformaBenchmark,
  mlsComps: nycSalesComps, // LIVE — NYC recorded sales (was mock/mls-comps.ts)
  costarDeals: mockCostarDeals,
};
