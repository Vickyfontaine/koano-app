// REPRESENTATIVE provider — MLS comparable sales.
// Representative of Park Slope / Gowanus comp profiles. Clearly labeled.

import type { MlsCompsProvider, MlsCompsSummary, ProviderResult, ResolvedAddress } from '../types';

const SWAP_NOTE =
  'SWAP TO LIVE: CoreLogic/Trestle MLS feed or ATTOM Sales Comparables API. ' +
  'Registry change: in /lib/providers/registry.ts set `mlsComps: attomComps` ' +
  '(implement /lib/providers/real/attom-comps.ts using ATTOM_API_KEY).';

export const mockMlsComps: MlsCompsProvider = {
  name: 'MLS comparable sales [REPRESENTATIVE]',

  async getComps(addr: ResolvedAddress): Promise<ProviderResult<MlsCompsSummary>> {
    const area = addr.borough ?? 'Brooklyn';
    const data: MlsCompsSummary = {
      comps: [
        { address: `${area} comp A (representative)`, sale_price: 1750000, sale_date: '2026-05-14', days_on_market: 34, price_per_sqft: 1090 },
        { address: `${area} comp B (representative)`, sale_price: 1420000, sale_date: '2026-04-02', days_on_market: 41, price_per_sqft: 985 },
        { address: `${area} comp C (representative)`, sale_price: 2100000, sale_date: '2026-03-19', days_on_market: 28, price_per_sqft: 1175 },
        { address: `${area} comp D (representative)`, sale_price: 1615000, sale_date: '2026-02-06', days_on_market: 52, price_per_sqft: 1010 },
      ],
      median_dom: 37,
      median_price_per_sqft: 1050,
      dom_trend: 'compressing',
    };
    return {
      ok: true,
      data,
      provenance: 'representative',
      source: 'KOANO representative comps (Brownstone Brooklyn profile)',
      fetched_at: new Date().toISOString(),
      swap_note: SWAP_NOTE,
    };
  },
};
