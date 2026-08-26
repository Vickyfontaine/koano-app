// Out-of-market MUNICIPAL coverage result.
//
// KOANO's differentiated municipal layer (DOB permits, MapPLUTO zoning, HPD/ECB
// violations, HPD landlord registrations, DOB entitlement filings, tax-block
// assemblage) is NYC parcel-level data, queried by BBL. A non-NYC address has no
// BBL, so there is nothing to query. The correct answer is coverage-absent —
// `data: null` plus an honest, layer-named note — NEVER a NYC-flavored stand-in
// value (e.g. "typical Brooklyn permit profile, 350 permits"), which would be
// fabrication for the WRONG market: technically labeled, but a fabricated figure
// presented for a building it does not describe.
//
// Provenance is 'coverage_absent' (Slice 4) — a FIRST-CLASS state, no longer a
// shade of 'representative': we do not cover this market/layer, so nothing was
// queried and there is no figure to evaluate. It is DISTINCT from a live-call
// FAILURE on a real NYC BBL (which is 'fetch_failed' — we cover it, the call
// failed, retry may fix it) and from 'representative' (a deliberate stand-in for
// an unfunded paid source). The coverage map (Slice 5) keys off provenance
// === 'coverage_absent' to name exactly which layers a given market is missing.

import type { ProviderResult } from '../types';

export function outOfMarketMunicipal<T>(opts: {
  layer: string; // human name of the missing layer, e.g. "DOB permits"
  dataset: string; // the dataset/source label, e.g. "NYC Open Data — MapPLUTO (64uk-42ks)"
  fetched_at: string;
}): ProviderResult<T> {
  return {
    ok: true,
    data: null,
    provenance: 'coverage_absent',
    source: `${opts.dataset} — outside NYC coverage (not queried)`,
    fetched_at: opts.fetched_at,
    error:
      `Out of coverage: ${opts.layer} is a NYC parcel-level layer queried by BBL. ` +
      `This address resolved outside NYC, so no municipal record was retrieved: ` +
      `a coverage gap for this market, not a stand-in value.`,
  };
}
