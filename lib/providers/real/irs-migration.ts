// IRS SOI county migration — reads the self-hosted `irs_migration` table
// (ingested once from the IRS bulk CSVs; there is no live API). Tagged `live`
// with the vintage: the figures ARE the authoritative IRS record, just annually
// published (same treatment as ACS/FHFA).
//
// Omission discipline: when the table is empty/unseeded (or missing entirely
// before migration-012 runs), this returns data:null tagged `live` — a coverage
// absence, NOT representative — so the Demand agent simply omits the signal and
// stays live on HMDA + QCEW. It never fabricates a migration figure.

import { supabaseAdmin } from '../../supabase/server';
import type { MigrationInfo, MigrationProvider, ProviderResult, ResolvedAddress } from '../types';
import { errMsg } from './http';

function omit(fetched_at: string, reason: string): ProviderResult<MigrationInfo> {
  return {
    ok: false,
    data: null,
    provenance: 'live', // coverage absence, never representative
    source: 'IRS SOI county-to-county migration',
    fetched_at,
    error: reason,
  };
}

export const irsMigration: MigrationProvider = {
  name: 'IRS SOI county migration',

  async getMigration(addr: ResolvedAddress): Promise<ProviderResult<MigrationInfo>> {
    const fetched_at = new Date().toISOString();
    if (!addr.state_fips || !addr.county_fips) return omit(fetched_at, 'No county FIPS resolved');

    try {
      const admin = supabaseAdmin();
      const { data, error } = await admin
        .from('irs_migration')
        .select('vintage, inflow_returns, inflow_agi_thousands, outflow_returns, outflow_agi_thousands')
        .eq('fips_state', addr.state_fips)
        .eq('fips_county', addr.county_fips)
        .order('vintage', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Table missing (migration not yet run) or query failure → omit (live),
      // never representative.
      if (error) return omit(fetched_at, `IRS migration unavailable: ${error.message}`);
      if (!data) return omit(fetched_at, 'No IRS migration row for county (unseeded or out of coverage)');

      const inflow = data.inflow_returns ?? null;
      const outflow = data.outflow_returns ?? null;
      const perReturn = (agiThousands: number | null, returns: number | null) =>
        agiThousands != null && returns && returns > 0 ? Math.round((agiThousands * 1000) / returns) : null;

      const info: MigrationInfo = {
        vintage: `IRS SOI ${data.vintage}`,
        inflow_returns: inflow,
        outflow_returns: outflow,
        net_migration_returns: inflow != null && outflow != null ? inflow - outflow : null,
        inflow_agi_per_return_usd: perReturn(data.inflow_agi_thousands, inflow),
        outflow_agi_per_return_usd: perReturn(data.outflow_agi_thousands, outflow),
        scope_note:
          `IRS SOI county-to-county migration (${data.vintage}). Returns ≈ households; AGI-per-return ≈ average ` +
          'income of movers. Net = in − out. Address = filing address (not necessarily residence); ~2-year vintage.',
      };

      return {
        ok: true,
        data: info,
        provenance: 'live',
        source: `IRS SOI county migration (${data.vintage})`,
        fetched_at,
      };
    } catch (e) {
      return omit(fetched_at, `IRS migration unavailable: ${errMsg(e)}`);
    }
  },
};
