// REPRESENTATIVE provider — institutional transaction comps (CoStar stand-in).

import type { CostarDealsProvider, CostarDealsSummary, ProviderResult, ResolvedAddress } from '../types';

const SWAP_NOTE =
  'SWAP TO LIVE: CoStar/LoopNet Comps API or MSCI Real Capital Analytics (Cluster 5, Phase 4). ' +
  'Registry change: in /lib/providers/registry.ts set `costarDeals: costarDeals` ' +
  '(implement /lib/providers/real/costar-deals.ts using COSTAR_API_KEY).';

export const mockCostarDeals: CostarDealsProvider = {
  name: 'Institutional deal comps [REPRESENTATIVE — CoStar stand-in]',

  async getDeals(addr: ResolvedAddress): Promise<ProviderResult<CostarDealsSummary>> {
    const sub = `${addr.borough ?? 'Brooklyn'} (representative)`;
    const data: CostarDealsSummary = {
      deals: [
        { property_type: 'Multifamily', sale_price: 46500000, cap_rate_pct: 5.1, sale_date: '2026-04-30', submarket: sub },
        { property_type: 'Mixed-use', sale_price: 23750000, cap_rate_pct: 5.6, sale_date: '2026-03-12', submarket: sub },
        { property_type: 'Industrial', sale_price: 18200000, cap_rate_pct: 6.2, sale_date: '2026-01-27', submarket: sub },
      ],
      median_cap_rate_pct: 5.6,
      transaction_volume_yoy_pct: 12,
    };
    return {
      ok: true,
      data,
      provenance: 'representative',
      source: 'KOANO representative institutional comps (Brooklyn, 2026 vintage)',
      fetched_at: new Date().toISOString(),
      swap_note: SWAP_NOTE,
    };
  },
};
