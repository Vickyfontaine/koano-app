// Address resolution:
//   NYC addresses  → NYC GeoSearch (Pelias, free, no key) for lat/lon + BBL/BIN,
//                    then US Census coordinates geocoder for tract GEOID.
//   Non-NYC (GeoSearch returns no match) → US Census onelineaddress geocoder,
//                    which yields lat/lon + state/county/tract + ZIP nationwide.
// provenance: "live".
//
// CRITICAL (see below): a non-NYC resolution sets bbl, bin, and borough to
// EXPLICIT null. Every NYC-specific provider keys off BBL (or borough) and, on a
// null BBL, degrades to a clearly-labeled `representative` result rather than
// querying NYC datasets with an empty key and returning a live zero that reads
// as "no violations / no permits / no sales". These fields must never be an
// empty string or a fabricated value — absence has to be unambiguous downstream.

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

// US Census onelineaddress geocoder — national, keyless. Returns coordinates +
// ZIP + tract geography in a single call, so a non-NYC address still resolves to
// everything the federal (national) providers need. NYC-specific fields (bbl,
// bin, borough) are intentionally left null by the caller.
interface CensusOnelineResponse {
  result?: {
    addressMatches?: Array<{
      matchedAddress?: string;
      coordinates?: { x?: number; y?: number };
      addressComponents?: { zip?: string; state?: string };
      geographies?: {
        ['Census Tracts']?: Array<{
          GEOID?: string;
          STATE?: string;
          COUNTY?: string;
          TRACT?: string;
        }>;
      };
    }>;
  };
}

async function fromCensusOneline(address: string): Promise<ResolvedAddress | null> {
  const url =
    `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress` +
    `?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current` +
    `&vintage=Current_Current&layers=Census%20Tracts&format=json`;
  const res = await fetchJson<CensusOnelineResponse>(url, { timeoutMs: 20000 });
  const match = res.result?.addressMatches?.[0];
  const coords = match?.coordinates;
  if (!match || typeof coords?.x !== 'number' || typeof coords?.y !== 'number') return null;

  const tract = match.geographies?.['Census Tracts']?.[0] ?? null;
  return {
    input: address,
    normalized: match.matchedAddress ?? address,
    latitude: coords.y,
    longitude: coords.x,
    // NYC-only identifiers — EXPLICITLY absent for a non-NYC address. Downstream
    // NYC providers treat null bbl/borough as "outside coverage", never as a
    // valid key to query with.
    borough: null,
    bbl: null,
    bin: null,
    zip: match.addressComponents?.zip ?? null,
    state_fips: tract?.STATE ?? null,
    county_fips: tract?.COUNTY ?? null,
    tract_code: tract?.TRACT ?? null,
    tract_geoid: tract?.GEOID ?? null,
    // The national geocoder is authoritative for a non-NYC address; when we
    // return this result directly it is a cross-checked, confirmed location.
    location_confidence: 'confirmed',
  };
}

// The five NYC county FIPS codes (New York State = 36): Bronx 005, Kings 047,
// New York 061, Queens 081, Richmond 085. Used to tell whether the national
// geocoder placed an address INSIDE NYC (so a GeoSearch/Census disagreement is
// two NYC candidates — unresolvable) versus outside it (a genuine non-NYC hit).
const NYC_COUNTY_FIPS = new Set(['005', '047', '061', '081', '085']);
function isNycLocation(a: Pick<ResolvedAddress, 'state_fips' | 'county_fips' | 'latitude' | 'longitude'>): boolean {
  if (a.state_fips === '36' && a.county_fips && NYC_COUNTY_FIPS.has(a.county_fips)) return true;
  // Fallback when the national match carried no county — a rough NYC bounding box.
  if (a.county_fips == null) {
    return a.latitude >= 40.48 && a.latitude <= 40.93 && a.longitude >= -74.28 && a.longitude <= -73.68;
  }
  return false;
}

// Tract/FIPS from a lat/lon (used only when the national geocoder couldn't
// parse the address but NYC GeoSearch did — an odd-format but real NYC address).
async function tractFromCoordinates(
  lon: number,
  lat: number,
): Promise<Pick<ResolvedAddress, 'state_fips' | 'county_fips' | 'tract_code' | 'tract_geoid'>> {
  try {
    const url =
      `https://geocoding.geo.census.gov/geocoder/geographies/coordinates` +
      `?x=${lon}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current` +
      `&layers=Census%20Tracts&format=json`;
    const census = await fetchJson<CensusGeoResponse>(url);
    const t = census.result?.geographies?.['Census Tracts']?.[0];
    if (t) return { state_fips: t.STATE ?? null, county_fips: t.COUNTY ?? null, tract_code: t.TRACT ?? null, tract_geoid: t.GEOID ?? null };
  } catch {
    // best-effort; downstream providers handle null tract
  }
  return { state_fips: null, county_fips: null, tract_code: null, tract_geoid: null };
}

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export const nycGeoSearch: GeocodeProvider = {
  name: 'NYC GeoSearch + US Census Geocoder',

  async resolve(address: string): Promise<ProviderResult<ResolvedAddress>> {
    const fetched_at = new Date().toISOString();
    const geoUrl = `https://geosearch.planninglabs.nyc/v2/search?text=${encodeURIComponent(address)}&size=1`;
    try {
      // Run both geocoders in parallel. The national Census geocoder is the
      // authoritative cross-check: NYC GeoSearch fuzzy-matches non-NYC inputs to
      // the nearest NYC lot at FULL confidence (e.g. "1 S Broad St, Philadelphia"
      // → "1 Broad St, Manhattan", confidence 0.8 — identical to a real hit), so
      // confidence/match_type cannot tell a real NYC hit from a mis-match. Only
      // geographic agreement can.
      const [national, feat] = await Promise.all([
        fromCensusOneline(address).catch(() => null),
        fetchJson<GeoSearchResponse>(geoUrl)
          .then((g) => g.features?.[0] ?? null)
          .catch(() => null),
      ]);

      if (feat) {
        const [longitude, latitude] = feat.geometry.coordinates;
        const props = feat.properties;
        const nycHit = (
          fips: Pick<ResolvedAddress, 'state_fips' | 'county_fips' | 'tract_code' | 'tract_geoid'>,
          confidence: ResolvedAddress['location_confidence'],
          source: string,
        ): ProviderResult<ResolvedAddress> => ({
          ok: true,
          data: {
            input: address,
            normalized: props.label ?? address,
            latitude,
            longitude,
            borough: props.borough ?? null,
            bbl: props.addendum?.pad?.bbl ?? null,
            bin: props.addendum?.pad?.bin ?? null,
            zip: props.postalcode ?? national?.zip ?? null,
            location_confidence: confidence,
            ...fips,
          },
          provenance: 'live',
          source,
          endpoint: geoUrl,
          fetched_at,
        });

        // No national cross-check available (odd-format address the Census
        // geocoder couldn't parse). Trust GeoSearch, but a fuzzy mis-match could
        // NOT have been caught here — mark the location UNCONFIRMED so the UI and
        // documents flag it. Live data on this point may describe the wrong lot.
        if (!national) {
          const fips = await tractFromCoordinates(longitude, latitude);
          return nycHit(
            fips,
            'unconfirmed',
            'NYC GeoSearch (NYC Planning Labs) — single-source, no national cross-check',
          );
        }

        const km = haversineKm(latitude, longitude, national.latitude, national.longitude);
        if (km <= 2) {
          // The two geocoders agree on WHERE — a cross-checked, confirmed NYC hit.
          return nycHit(
            {
              state_fips: national.state_fips,
              county_fips: national.county_fips,
              tract_code: national.tract_code,
              tract_geoid: national.tract_geoid,
            },
            'confirmed',
            'NYC GeoSearch (NYC Planning Labs) + US Census Geocoder',
          );
        }

        // The two geocoders disagree by >2 km. GeoSearch's NYC lot is suspect.
        // WHERE did the national geocoder land?
        if (isNycLocation(national)) {
          // Both point to NYC but to buildings 2+ km apart: GeoSearch mis-keyed
          // (e.g. a wrong ZIP steered it to the wrong lot) and the national
          // geocoder cannot supply a BBL. We cannot say WHICH NYC building this
          // is, so we REFUSE — KOANO returns nothing rather than a confident run
          // on a plausible wrong building. (Regression guard: "175 3 Street,
          // Brooklyn NY 11201" → GeoSearch "175 Adams St", Census "175 3rd St".)
          throw new Error(
            `Could not confidently resolve this address to a specific NYC building — two candidate ` +
              `locations ${km.toFixed(1)} km apart (GeoSearch: "${props.label ?? address}"; Census: ` +
              `"${national.normalized}"). The ZIP or street format may be ambiguous; check the address and retry.`,
          );
        }

        // The national geocoder placed the address OUTSIDE NYC — GeoSearch
        // fuzzy-matched a genuinely non-NYC address to a NYC lot. Use the
        // authoritative non-NYC result (bbl/bin/borough already null).
        return {
          ok: true,
          data: national,
          provenance: 'live',
          source: 'US Census Geocoder (onelineaddress) — non-NYC (NYC GeoSearch match rejected as fuzzy mis-match)',
          endpoint: geoUrl,
          fetched_at,
        };
      }

      // No NYC candidate at all — use the national geocoder if it matched.
      if (national) {
        return {
          ok: true,
          data: national,
          provenance: 'live',
          source: 'US Census Geocoder (onelineaddress) — national, non-NYC',
          endpoint: geoUrl,
          fetched_at,
        };
      }

      throw new Error('No geocoding match (NYC GeoSearch and US Census both returned no match)');
    } catch (e) {
      return {
        ok: false,
        data: null,
        provenance: 'live',
        source: 'NYC GeoSearch + US Census Geocoder',
        endpoint: geoUrl,
        fetched_at,
        error: errMsg(e),
      };
    }
  },
};
