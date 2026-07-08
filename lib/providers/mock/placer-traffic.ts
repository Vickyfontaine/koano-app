// REPRESENTATIVE provider — foot traffic (Placer.ai stand-in). Clearly labeled.

import type { FootTrafficInfo, FootTrafficProvider, ProviderResult, ResolvedAddress } from '../types';

const SWAP_NOTE =
  'SWAP TO LIVE: Placer.ai Insights API (venue/area foot traffic). ' +
  'Registry change: in /lib/providers/registry.ts set `footTraffic: placerTraffic` ' +
  '(implement /lib/providers/real/placer-traffic.ts using PLACER_API_KEY).';

export const mockPlacerTraffic: FootTrafficProvider = {
  name: 'Foot traffic [REPRESENTATIVE — Placer.ai stand-in]',

  async getFootTraffic(addr: ResolvedAddress): Promise<ProviderResult<FootTrafficInfo>> {
    const data: FootTrafficInfo = {
      area: `${addr.zip ?? 'NYC'} retail corridor (representative)`,
      monthly_visits: 184000,
      yoy_change_pct: 7.4,
      weekend_share_pct: 38,
    };
    return {
      ok: true,
      data,
      provenance: 'representative',
      source: 'KOANO representative foot-traffic profile (gentrifying Brooklyn corridor)',
      fetched_at: new Date().toISOString(),
      swap_note: SWAP_NOTE,
    };
  },
};
