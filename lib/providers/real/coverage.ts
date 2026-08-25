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
// Provenance stays 'representative' so the verdict still rolls up "not fully
// live" for an out-of-market address (§07) — but it carries NO invented figure.
//
// This is DISTINCT from a live-call FAILURE on a real NYC BBL, which keeps the
// existing representative fallback (labeled degradation of an attempted call).
// The discriminator downstream is `provenance === 'representative' && data === null`
// = out of market; the coverage map (Phase 5, Slice 5) keys off exactly this to
// name which layers a given market is missing.

import type { ProviderResult } from '../types';

export function outOfMarketMunicipal<T>(opts: {
  layer: string; // human name of the missing layer, e.g. "DOB permits"
  dataset: string; // the dataset/source label, e.g. "NYC Open Data — MapPLUTO (64uk-42ks)"
  fetched_at: string;
}): ProviderResult<T> {
  return {
    ok: true,
    data: null,
    provenance: 'representative',
    source: `${opts.dataset} — outside NYC coverage (not queried)`,
    fetched_at: opts.fetched_at,
    error:
      `Out of coverage: ${opts.layer} is a NYC parcel-level layer queried by BBL. ` +
      `This address resolved outside NYC, so no municipal record was retrieved — ` +
      `a coverage gap for this market, not a stand-in value.`,
  };
}
