// OpenFEMA — federally-declared disaster HISTORY for the county (multi-peril,
// historical frequency). National, keyless, public domain. provenance: "live".
//
// COMPLEMENTS the FEMA NFHL flood provider — it is NOT the regulatory flood zone
// (that is NFHL, current insurance reality). This is how often, and for what,
// this county has actually been federally declared a disaster: a broader,
// historical, multi-peril signal.
//
// FEMA terms REQUIRE a non-endorsement disclaimer wherever the data is shown; it
// is carried in scope_note so it flows into the agent's data points and any
// document that cites this source.

import type {
  DisasterHistoryInfo,
  DisasterHistoryProvider,
  ProviderResult,
  ResolvedAddress,
} from '../types';
import { errMsg, fetchJson } from './http';

const OPENFEMA = 'https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries';

const FEMA_DISCLAIMER =
  'This product uses the FEMA OpenFEMA API but is not endorsed by FEMA; the Federal Government / FEMA ' +
  'cannot vouch for data or analyses derived from it after retrieval.';

interface DeclarationRow {
  declarationDate?: string;
  incidentType?: string;
}
interface OpenFemaResponse {
  DisasterDeclarationsSummaries?: DeclarationRow[];
}

export const openFemaDisasters: DisasterHistoryProvider = {
  name: 'OpenFEMA disaster declaration history',

  async getDisasterHistory(addr: ResolvedAddress): Promise<ProviderResult<DisasterHistoryInfo>> {
    const fetched_at = new Date().toISOString();

    if (!addr.state_fips || !addr.county_fips) {
      return {
        ok: true,
        data: null,
        provenance: 'live',
        source: 'OpenFEMA DisasterDeclarationsSummaries — not queried',
        fetched_at,
        error: `No county FIPS resolved for this address — disaster history not queried. ${FEMA_DISCLAIMER}`,
      };
    }

    const filter = `fipsStateCode eq '${addr.state_fips}' and fipsCountyCode eq '${addr.county_fips}'`;
    const url =
      `${OPENFEMA}?$filter=${encodeURIComponent(filter)}` +
      `&$orderby=declarationDate desc&$top=1000`;

    try {
      const res = await fetchJson<OpenFemaResponse>(url.replace(/ /g, '%20'), { timeoutMs: 25000 });
      const rows = Array.isArray(res.DisasterDeclarationsSummaries) ? res.DisasterDeclarationsSummaries : [];

      const tenYrAgo = new Date();
      tenYrAgo.setFullYear(tenYrAgo.getFullYear() - 10);
      const tenYrIso = tenYrAgo.toISOString();

      let last10 = 0;
      const typeCounts = new Map<string, number>();
      for (const r of rows) {
        if (r.declarationDate && r.declarationDate >= tenYrIso) last10 += 1;
        const t = r.incidentType ?? 'Unknown';
        typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
      }

      const rankedTypes = Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1]);
      const mostRecent = rows[0] ?? null;

      const data: DisasterHistoryInfo = {
        fips_state: addr.state_fips,
        fips_county: addr.county_fips,
        total_declarations: rows.length,
        declarations_last_10yr: last10,
        distinct_incident_types: rankedTypes.slice(0, 5).map(([t]) => t),
        most_common_incident: rankedTypes[0]?.[0] ?? null,
        most_recent_declaration: mostRecent?.declarationDate
          ? `${mostRecent.declarationDate.slice(0, 7)} — ${mostRecent.incidentType ?? 'Unknown'}`
          : null,
        scope_note:
          `Federally-declared disasters for this county (OpenFEMA), all years. Historical multi-peril ` +
          `frequency — complements, not duplicates, the FEMA NFHL regulatory flood zone. ${FEMA_DISCLAIMER}`,
      };

      return {
        ok: true,
        data,
        provenance: 'live',
        source: 'FEMA OpenFEMA — DisasterDeclarationsSummaries',
        endpoint: url,
        fetched_at,
      };
    } catch (e) {
      return {
        ok: true,
        data: null,
        provenance: 'fetch_failed',
        source: 'FEMA OpenFEMA [live call failed]',
        endpoint: url,
        fetched_at,
        error: `Live call failed: ${errMsg(e)}`,
      };
    }
  },
};
