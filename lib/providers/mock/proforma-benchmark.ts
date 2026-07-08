// REPRESENTATIVE provider — development pro forma benchmarks.
// Values are representative of published 2025–2026 Brooklyn development
// benchmarks, clearly labeled. Never presented as live.

import type { ProformaBenchmark, ProformaBenchmarkProvider, ProviderResult, ResolvedAddress } from '../types';

const SWAP_NOTE =
  'SWAP TO LIVE: CoStar Market Analytics or HouseCanary (land + construction benchmarks). ' +
  'Registry change: in /lib/providers/registry.ts set `proformaBenchmark: costarProforma` ' +
  '(implement /lib/providers/real/costar-proforma.ts using COSTAR_API_KEY).';

export const mockProformaBenchmark: ProformaBenchmarkProvider = {
  name: 'Pro forma benchmarks [REPRESENTATIVE]',

  async getBenchmarks(addr: ResolvedAddress): Promise<ProviderResult<ProformaBenchmark>> {
    const data: ProformaBenchmark = {
      submarket: `${addr.borough ?? 'NYC'} — ${addr.zip ?? 'unknown zip'} (representative)`,
      land_cost_per_buildable_sf: 210,
      construction_cost_per_sf: 465,
      exit_cap_rate_pct: 5.25,
      absorption_units_per_month: 11,
    };
    return {
      ok: true,
      data,
      provenance: 'representative',
      source: 'KOANO representative benchmarks (Brooklyn multifamily, 2025–2026 vintage)',
      fetched_at: new Date().toISOString(),
      swap_note: SWAP_NOTE,
    };
  },
};
