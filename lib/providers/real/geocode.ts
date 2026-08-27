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

import type {
  AddressCandidate,
  GeocodeProvider,
  GeocodeResolution,
  ProviderResult,
  ResolvedAddress,
} from '../types';
import { errMsg, fetchJson } from './http';

const PROVIDER_NAME = 'NYC GeoSearch + US Census Geocoder';
const GEOSEARCH = 'https://geosearch.planninglabs.nyc/v2';

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

// --- candidate ranking -------------------------------------------------------
// A house-number + normalized-street key, so an EXACT street match (the strong
// signal) can outrank a ZIP-area match — which is exactly what mis-steered the
// bug: "175 3 Street … 11201" → GeoSearch trusted the wrong ZIP → "175 Adams St",
// while Census matched the street → "175 3rd St". We ORDER the picker by this;
// we never silently auto-correct — the user still chooses.
const STREET_SUFFIXES = new Set([
  'ST', 'STREET', 'AVE', 'AVENUE', 'RD', 'ROAD', 'PL', 'PLACE', 'BLVD', 'BOULEVARD',
  'LN', 'LANE', 'DR', 'DRIVE', 'CT', 'COURT', 'TER', 'TERRACE', 'PKWY', 'PARKWAY',
  'HWY', 'HIGHWAY', 'SQ', 'SQUARE', 'PLZ', 'PLAZA', 'WAY', 'LOOP', 'ALLEY', 'WALK',
]);
const DIRECTIONALS = new Set(['N', 'S', 'E', 'W', 'NORTH', 'SOUTH', 'EAST', 'WEST']);
function streetKey(label: string): { num: string; core: string } | null {
  const first = label.split(',')[0].trim().toUpperCase();
  const m = first.match(/^(\d+[A-Z]?)\s+(.+)$/); // leading house number + street
  if (!m) return null;
  const core = m[2]
    .replace(/[.#]/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^(\d+)(ST|ND|RD|TH)$/, '$1')) // 3RD → 3, 1ST → 1
    .filter((t) => t && !STREET_SUFFIXES.has(t) && !DIRECTIONALS.has(t))
    .join(' ');
  return { num: m[1], core };
}
function isExactStreetMatch(input: string, candidateLabel: string): boolean {
  const a = streetKey(input);
  const b = streetKey(candidateLabel);
  if (!a || !b || !a.core || !b.core) return false;
  return a.num === b.num && a.core === b.core;
}
function rankCandidates(
  input: string,
  partials: Omit<AddressCandidate, 'match_reason'>[],
): AddressCandidate[] {
  return partials
    .map((p) => ({ p, exact: isExactStreetMatch(input, p.label) }))
    .sort((a, b) => Number(b.exact) - Number(a.exact)) // exact-street match first
    .map(({ p, exact }) => ({ ...p, match_reason: exact ? 'Exact street match' : 'ZIP-area match' }));
}

// The full resolution logic. Runs both geocoders and cross-checks geographically.
async function resolveDetailedImpl(address: string): Promise<GeocodeResolution> {
  const geoUrl = `${GEOSEARCH}/search?text=${encodeURIComponent(address)}&size=1`;
  try {
    // Run both geocoders in parallel. The national Census geocoder is the
    // authoritative cross-check: NYC GeoSearch fuzzy-matches non-NYC inputs to
    // the nearest NYC lot at FULL confidence, so confidence alone can't tell a
    // real NYC hit from a mis-match — only geographic agreement can.
    const [national, feat] = await Promise.all([
      fromCensusOneline(address).catch(() => null),
      fetchJson<GeoSearchResponse>(geoUrl)
        .then((g) => g.features?.[0] ?? null)
        .catch(() => null),
    ]);

    if (feat) {
      const [longitude, latitude] = feat.geometry.coordinates;
      const props = feat.properties;
      const geoAddress = (
        confidence: ResolvedAddress['location_confidence'],
        fips: Pick<ResolvedAddress, 'state_fips' | 'county_fips' | 'tract_code' | 'tract_geoid'>,
      ): ResolvedAddress => ({
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
      });

      // No national cross-check (odd-format address Census couldn't parse). Trust
      // GeoSearch, but a fuzzy mis-match could NOT have been caught → UNCONFIRMED.
      if (!national) {
        const fips = await tractFromCoordinates(longitude, latitude);
        return { kind: 'resolved', address: geoAddress('unconfirmed', fips) };
      }

      const km = haversineKm(latitude, longitude, national.latitude, national.longitude);
      if (km <= 2) {
        // Both geocoders agree on WHERE — a cross-checked, confirmed NYC hit.
        return {
          kind: 'resolved',
          address: geoAddress('confirmed', {
            state_fips: national.state_fips,
            county_fips: national.county_fips,
            tract_code: national.tract_code,
            tract_geoid: national.tract_geoid,
          }),
        };
      }

      // >2 km disagreement. WHERE did the national geocoder land?
      if (isNycLocation(national)) {
        // Both point to NYC but to buildings 2+ km apart: we cannot say WHICH
        // NYC building this is. Instead of a wall (the old throw), surface BOTH
        // candidates and let the user disambiguate. (Regression: "175 3 Street,
        // Brooklyn NY 11201" → GeoSearch "175 Adams St", Census "175 3rd St".)
        const candidates = rankCandidates(address, [
          {
            id: 'geosearch',
            label: props.label ?? address,
            latitude,
            longitude,
            bbl: props.addendum?.pad?.bbl ?? null,
            borough: props.borough ?? null,
            zip: props.postalcode ?? null,
            source: 'NYC GeoSearch',
          },
          {
            id: 'census',
            label: national.normalized,
            latitude: national.latitude,
            longitude: national.longitude,
            bbl: null, // Census supplies no BBL — re-derived server-side on selection
            borough: null,
            zip: national.zip,
            source: 'US Census',
          },
        ]);
        return { kind: 'ambiguous', candidates };
      }

      // National placed the address OUTSIDE NYC — GeoSearch fuzzy-matched a
      // genuinely non-NYC address to a NYC lot. Use the authoritative non-NYC
      // result (bbl/bin/borough already null).
      return { kind: 'resolved', address: national };
    }

    // No NYC candidate at all — use the national geocoder if it matched.
    if (national) return { kind: 'resolved', address: national };
    return {
      kind: 'none',
      error: 'No geocoding match (NYC GeoSearch and US Census both returned no match)',
    };
  } catch (e) {
    return { kind: 'none', error: errMsg(e) };
  }
}

// Turn a user-chosen candidate into a CONFIRMED address with a real BBL. The BBL
// is RE-DERIVED server-side by reverse-geocoding the coordinates the user picked
// — candidate.bbl (client-supplied) is never trusted. "The server derived this
// BBL from the selected point" is the defensible audit story; the browser's word
// is not. The user's pick is itself the cross-check, so confidence = 'confirmed'.
async function resolveCandidateImpl(
  candidate: AddressCandidate,
): Promise<ProviderResult<ResolvedAddress>> {
  const fetched_at = new Date().toISOString();
  const searchUrl = `${GEOSEARCH}/search?text=${encodeURIComponent(candidate.label)}&size=1`;
  const revUrl = `${GEOSEARCH}/reverse?point.lat=${candidate.latitude}&point.lon=${candidate.longitude}&size=1`;
  try {
    let lat = candidate.latitude;
    let lon = candidate.longitude;
    let bbl: string | null = null;
    let bin: string | null = null;
    let borough = candidate.borough ?? null;
    let normalized = candidate.label;

    // PRIMARY: re-geocode the CHOSEN address string server-side. The label
    // carries the corrected ZIP, so GeoSearch resolves it to the precise lot —
    // and we accept it ONLY if that lot sits at the user-selected point (<= 2 km),
    // so the label can't fuzzy-match a third building. This also yields the
    // precise building COORDINATES, correcting the ~120 m Census offset that made
    // the flood layer misread the wrong zone in the original bug.
    const sf = await fetchJson<GeoSearchResponse>(searchUrl)
      .then((g) => g.features?.[0] ?? null)
      .catch(() => null);
    if (sf) {
      const [slon, slat] = sf.geometry.coordinates;
      if (haversineKm(candidate.latitude, candidate.longitude, slat, slon) <= 2) {
        bbl = sf.properties?.addendum?.pad?.bbl ?? null;
        bin = sf.properties?.addendum?.pad?.bin ?? null;
        borough = sf.properties?.borough ?? borough;
        normalized = sf.properties?.label ?? normalized;
        lat = slat;
        lon = slon;
      }
    }

    // FALLBACK: the label didn't resolve to a lot near the point → reverse-geocode
    // the selected coordinates. Less precise (the point may be offset onto an
    // adjacent lot), so it is only used when the precise search path came up empty.
    if (!bbl) {
      const rev = await fetchJson<GeoSearchResponse>(revUrl)
        .then((g) => g.features?.[0] ?? null)
        .catch(() => null);
      bbl = rev?.properties?.addendum?.pad?.bbl ?? null;
      bin = rev?.properties?.addendum?.pad?.bin ?? bin;
      borough = rev?.properties?.borough ?? borough;
      if (rev?.properties?.label) normalized = rev.properties.label;
    }

    const fips = await tractFromCoordinates(lon, lat);
    return {
      ok: true,
      data: {
        input: candidate.label,
        normalized,
        latitude: lat,
        longitude: lon,
        borough,
        bbl,
        bin,
        zip: candidate.zip,
        location_confidence: 'confirmed',
        ...fips,
      },
      provenance: 'live',
      source: 'NYC GeoSearch (server-derived BBL from the selected address, point-verified) + US Census tract',
      endpoint: searchUrl,
      fetched_at,
    };
  } catch (e) {
    return {
      ok: false,
      data: null,
      provenance: 'live',
      source: 'NYC GeoSearch candidate resolution',
      endpoint: searchUrl,
      fetched_at,
      error: errMsg(e),
    };
  }
}

export const nycGeoSearch: GeocodeProvider = {
  name: PROVIDER_NAME,

  resolveDetailed: resolveDetailedImpl,
  resolveCandidate: resolveCandidateImpl,

  // Convenience wrapper for NON-INTERACTIVE callers (archive, briefing,
  // documents). On ambiguity there is no user to disambiguate, so it auto-selects
  // the top-ranked (exact-street) candidate but tags it UNCONFIRMED — never a
  // wall, never a silent CONFIRMED guess. Interactive callers use resolveDetailed
  // + a picker instead.
  async resolve(address: string): Promise<ProviderResult<ResolvedAddress>> {
    const fetched_at = new Date().toISOString();
    const r = await resolveDetailedImpl(address);
    if (r.kind === 'resolved') {
      return { ok: true, data: r.address, provenance: 'live', source: PROVIDER_NAME, fetched_at };
    }
    if (r.kind === 'ambiguous') {
      const rc = await resolveCandidateImpl(r.candidates[0]);
      if (rc.ok && rc.data) {
        return {
          ...rc,
          data: { ...rc.data, location_confidence: 'unconfirmed' },
          source: `${rc.source}: auto-selected among ${r.candidates.length} candidates (unverified; no user disambiguation)`,
        };
      }
      return {
        ok: false,
        data: null,
        provenance: 'live',
        source: PROVIDER_NAME,
        fetched_at,
        error: rc.error ?? 'ambiguous address; candidate resolution failed',
      };
    }
    return { ok: false, data: null, provenance: 'live', source: PROVIDER_NAME, fetched_at, error: r.error };
  },
};
