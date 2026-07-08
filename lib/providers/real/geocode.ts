// Address resolution: NYC GeoSearch (Pelias, free, no key) for lat/lon + BBL/BIN,
// then US Census geocoder for tract GEOID. provenance: "live".

import type { GeocodeProvider, ProviderResult, ResolvedAddress } from '../types';
import { errMsg, fetchJson } from './http';

interface GeoSearchResponse {
  features: Array<{
    geometry: { coordinates: [number, number] };
    properties: {
      label?: string;
      borough?: string;
      postalcode?: string;
      addendum?: { pad?: { bbl?: string; bin?: string } };
    };
  }>;
}

interface CensusGeoResponse {
  result?: {
    geographies?: {
      ['Census Tracts']?: Array<{
        GEOID?: string;
        STATE?: string;
        COUNTY?: string;
        TRACT?: string;
      }>;
    };
  };
}

export const nycGeoSearch: GeocodeProvider = {
  name: 'NYC GeoSearch + US Census Geocoder',

  async resolve(address: string): Promise<ProviderResult<ResolvedAddress>> {
    const fetched_at = new Date().toISOString();
    const geoUrl = `https://geosearch.planninglabs.nyc/v2/search?text=${encodeURIComponent(address)}&size=1`;
    try {
      const geo = await fetchJson<GeoSearchResponse>(geoUrl);
      const feat = geo.features?.[0];
      if (!feat) throw new Error('No geocoding match for address');

      const [longitude, latitude] = feat.geometry.coordinates;
      const props = feat.properties;

      let state_fips: string | null = null;
      let county_fips: string | null = null;
      let tract_code: string | null = null;
      let tract_geoid: string | null = null;

      try {
        const censusUrl =
          `https://geocoding.geo.census.gov/geocoder/geographies/coordinates` +
          `?x=${longitude}&y=${latitude}&benchmark=Public_AR_Current&vintage=Current_Current` +
          `&layers=Census%20Tracts&format=json`;
        const census = await fetchJson<CensusGeoResponse>(censusUrl);
        const tract = census.result?.geographies?.['Census Tracts']?.[0];
        if (tract) {
          state_fips = tract.STATE ?? null;
          county_fips = tract.COUNTY ?? null;
          tract_code = tract.TRACT ?? null;
          tract_geoid = tract.GEOID ?? null;
        }
      } catch {
        // tract resolution is best-effort; downstream providers handle null
      }

      return {
        ok: true,
        data: {
          input: address,
          normalized: props.label ?? address,
          latitude,
          longitude,
          borough: props.borough ?? null,
          bbl: props.addendum?.pad?.bbl ?? null,
          bin: props.addendum?.pad?.bin ?? null,
          zip: props.postalcode ?? null,
          state_fips,
          county_fips,
          tract_code,
          tract_geoid,
        },
        provenance: 'live',
        source: 'NYC GeoSearch (NYC Planning Labs) + US Census Geocoder',
        endpoint: geoUrl,
        fetched_at,
      };
    } catch (e) {
      return {
        ok: false,
        data: null,
        provenance: 'live',
        source: 'NYC GeoSearch (NYC Planning Labs)',
        endpoint: geoUrl,
        fetched_at,
        error: errMsg(e),
      };
    }
  },
};
