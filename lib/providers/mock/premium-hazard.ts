// REPRESENTATIVE provider — premium climate hazard scores (First Street stand-in).

import type { PremiumHazardInfo, PremiumHazardProvider, ProviderResult, ResolvedAddress } from '../types';

const SWAP_NOTE =
  'SWAP TO LIVE: First Street Foundation API (Flood/Fire/Heat Factor). ' +
  'Registry change: in /lib/providers/registry.ts set `premiumHazard: firstStreetHazard` ' +
  '(implement /lib/providers/real/first-street.ts using FIRST_STREET_API_KEY).';

export const mockPremiumHazard: PremiumHazardProvider = {
  name: 'Premium climate hazard [REPRESENTATIVE — First Street stand-in]',

  async getHazards(_addr: ResolvedAddress): Promise<ProviderResult<PremiumHazardInfo>> {
    const data: PremiumHazardInfo = {
      flood_factor_1_to_10: 3,
      fire_factor_1_to_10: 1,
      heat_factor_1_to_10: 6,
      thirty_yr_flood_probability_pct: 9,
    };
    return {
      ok: true,
      data,
      provenance: 'representative',
      source: 'KOANO representative hazard profile (inland Brooklyn, near canal-adjacent zone)',
      fetched_at: new Date().toISOString(),
      swap_note: SWAP_NOTE,
    };
  },
};
