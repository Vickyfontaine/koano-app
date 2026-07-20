// Provider registry — maps each provider interface to exactly ONE active
// implementation. Swapping a representative provider for a live paid source is
// a one-line change here (see each mock provider's swap_note).

import type {
  BuildingViolationsProvider,
  CostarDealsProvider,
  CrimeProvider,
  LandlordPortfolioProvider,
  DemographicsProvider,
  FloodProvider,
  FootTrafficProvider,
  GeocodeProvider,
  HpiProvider,
  MlsCompsProvider,
  OpportunityZoneProvider,
  PermitsProvider,
  PremiumHazardProvider,
  ProformaBenchmarkProvider,
  SearchTrendsProvider,
  ZoningProvider,
} from './types';

import { nycGeoSearch } from './real/geocode';
import { nycLandlord } from './real/nyc-landlord';
import { nycPermits } from './real/nyc-permits';
import { nycViolations } from './real/nyc-violations';
import { nycZoning } from './real/nyc-zoning';
import { irsOpportunity } from './real/irs-opportunity';
import { censusAcs } from './real/census-acs';
import { fhfaHpi } from './real/fhfa-hpi';
import { femaFlood } from './real/fema-flood';
import { fbiUcr } from './real/fbi-ucr';
import { googleTrends } from './real/google-trends';
import { mockProformaBenchmark } from './mock/proforma-benchmark';
import { mockMlsComps } from './mock/mls-comps';
import { mockPlacerTraffic } from './mock/placer-traffic';
import { mockPremiumHazard } from './mock/premium-hazard';
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
  // representative providers — see each mock's swap_note for the live upgrade
  proformaBenchmark: ProformaBenchmarkProvider;
  mlsComps: MlsCompsProvider;
  footTraffic: FootTrafficProvider;
  premiumHazard: PremiumHazardProvider;
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
  // representative (mock) providers — one-line swap to live per swap_note
  proformaBenchmark: mockProformaBenchmark,
  mlsComps: mockMlsComps,
  footTraffic: mockPlacerTraffic,
  premiumHazard: mockPremiumHazard,
  costarDeals: mockCostarDeals,
};
