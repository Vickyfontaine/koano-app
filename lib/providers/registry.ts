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
  EntitlementProvider,
  LandlordPortfolioProvider,
  DemographicsProvider,
  FloodProvider,
  FootTrafficProvider,
  GeocodeProvider,
  HpiProvider,
  MlsCompsProvider,
  OpportunityZoneProvider,
  PermitsProvider,
  SeismicProvider,
  ProformaBenchmarkProvider,
  SearchTrendsProvider,
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
import { googleTrends } from './real/google-trends';
import { epaContamination } from './real/epa-superfund';
import { usgsSeismic } from './real/usgs-seismic';
import { openFemaDisasters } from './real/openfema-disasters';
import { noaaClimate } from './real/noaa-climate';
import { mockProformaBenchmark } from './mock/proforma-benchmark';
import { nycSalesComps } from './real/nyc-sales';
import { mockPlacerTraffic } from './mock/placer-traffic';
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
  searchTrends: SearchTrendsProvider;
  assemblage: AssemblageProvider;
  entitlement: EntitlementProvider;
  // environmental & climate hazard — federal, national, live free (re-base of
  // the former premium-hazard mock)
  contamination: ContaminationProvider;
  seismic: SeismicProvider;
  disasterHistory: DisasterHistoryProvider;
  climate: ClimateProvider;
  // representative providers — see each mock's swap_note for the live upgrade
  proformaBenchmark: ProformaBenchmarkProvider;
  mlsComps: MlsCompsProvider;
  footTraffic: FootTrafficProvider;
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
  searchTrends: googleTrends,
  assemblage: nycAssemblage,
  entitlement: nycDobFilings,
  // environmental & climate hazard — LIVE federal (was mock/premium-hazard.ts)
  contamination: epaContamination,
  seismic: usgsSeismic,
  disasterHistory: openFemaDisasters,
  climate: noaaClimate,
  // representative (mock) providers — one-line swap to live per swap_note
  proformaBenchmark: mockProformaBenchmark,
  mlsComps: nycSalesComps, // LIVE — NYC recorded sales (was mock/mls-comps.ts)
  footTraffic: mockPlacerTraffic,
  costarDeals: mockCostarDeals,
};
