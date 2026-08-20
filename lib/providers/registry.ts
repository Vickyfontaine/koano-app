// Provider registry — maps each provider interface to exactly ONE active
// implementation. Swapping a representative provider for a live paid source is
// a one-line change here (see each mock provider's swap_note).

import type {
  AssemblageProvider,
  BuildingViolationsProvider,
  ClimateProvider,
  ContaminationProvider,
  CostarDealsProvider,
  CrimeProvider,
  DisasterHistoryProvider,
  EmploymentProvider,
  EntitlementProvider,
  LandlordPortfolioProvider,
  DemographicsProvider,
  FloodProvider,
  GeocodeProvider,
  HpiProvider,
  MigrationProvider,
  MlsCompsProvider,
  MortgageDemandProvider,
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
import { censusAcs } from './real/census-acs';
import { fhfaHpi } from './real/fhfa-hpi';
import { femaFlood } from './real/fema-flood';
import { fbiUcr } from './real/fbi-ucr';
import { epaContamination } from './real/epa-superfund';
import { usgsSeismic } from './real/usgs-seismic';
import { openFemaDisasters } from './real/openfema-disasters';
import { noaaClimate } from './real/noaa-climate';
import { cfpbHmda } from './real/cfpb-hmda';
import { blsQcew } from './real/bls-qcew';
import { irsMigration } from './real/irs-migration';
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
  // housing demand — federal, national, live free (re-base of foot-traffic +
  // search-interest mocks)
  mortgageDemand: MortgageDemandProvider;
  employment: EmploymentProvider;
  migration: MigrationProvider;
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
  // housing demand — LIVE federal (re-base of foot-traffic + search-interest)
  mortgageDemand: cfpbHmda,
  employment: blsQcew,
  migration: irsMigration,
  // representative (mock) providers — one-line swap to live per swap_note
  proformaBenchmark: mockProformaBenchmark,
  mlsComps: nycSalesComps, // LIVE — NYC recorded sales (was mock/mls-comps.ts)
  costarDeals: mockCostarDeals,
};
