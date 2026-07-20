// Building violation histories — live NYC Open Data (SODA):
//   HPD Housing Maintenance Code Violations (wvxf-dwi5) — classes A/B/C/I
//   DOB ECB Violations (6bgk-3dad) — severity + active/resolved
//   DOB Complaints Received (eabe-havv) — active/closed
//   HPD Multiple Dwelling Registrations (tesw-yqqr) — registration check only,
//     so a zero-violation result can honestly say whether the building is even
//     in HPD's universe (registered multiple dwellings, 3+ residential units).
// Falls back to a labeled representative response on failure.
//
// Query keys: HPD datasets key on boroid/block/lot (bbl is null on old rows);
// ECB + DOB complaints key on BIN. ECB dates are YYYYMMDD text (lexicographic
// range filters are safe); DOB complaint dates are MM/DD/YYYY text, so those
// rows are fetched slim and windowed client-side.

import type {
  BuildingViolationsProvider,
  BuildingViolationsSummary,
  ProviderResult,
  ResolvedAddress,
  ViolationRecentItem,
} from '../types';
import { errMsg, fetchJson } from './http';

const HPD_VIOLATIONS = 'https://data.cityofnewyork.us/resource/wvxf-dwi5.json';
const ECB_VIOLATIONS = 'https://data.cityofnewyork.us/resource/6bgk-3dad.json';
const DOB_COMPLAINTS = 'https://data.cityofnewyork.us/resource/eabe-havv.json';
const HPD_REGISTRATIONS = 'https://data.cityofnewyork.us/resource/tesw-yqqr.json';

interface HpdRow {
  class?: string;
  violationstatus?: string;
  inspectiondate?: string;
  novdescription?: string;
}
interface EcbRow {
  severity?: string;
  ecb_violation_status?: string;
  issue_date?: string; // YYYYMMDD
  violation_type?: string;
  violation_description?: string;
}
interface DobComplaintRow {
  status?: string;
  date_entered?: string; // MM/DD/YYYY
  complaint_category?: string;
}

// bbl "2028870196" → { boroid: 2, block: 2887, lot: 196 }
function splitBbl(bbl: string): { boroid: number; block: number; lot: number } | null {
  if (!/^\d{10}$/.test(bbl)) return null;
  return {
    boroid: Number(bbl[0]),
    block: Number(bbl.slice(1, 6)),
    lot: Number(bbl.slice(6)),
  };
}

// Borough placeholder "million BINs" (1000000…5000000) mark unassigned
// buildings/vacant lots. Querying BIN-keyed datasets with one matches every
// placeholder lot in the borough — treat as no BIN.
export function realBin(bin: string | null): string | null {
  return bin && !/^\d0{6}$/.test(bin) ? bin : null;
}

function ecbDateToIso(d: string | undefined): string | null {
  if (!d || !/^\d{8}$/.test(d)) return null;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
}

function dobDateToIso(d: string | undefined): string | null {
  const m = d?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[1]}-${m[2]}` : null;
}

function isoCutoff(monthsAgo: number): string {
  const c = new Date();
  c.setMonth(c.getMonth() - monthsAgo);
  return c.toISOString().slice(0, 10);
}

const REPRESENTATIVE_FALLBACK: BuildingViolationsSummary = {
  bbl: null,
  bin: null,
  scope_note:
    'REPRESENTATIVE — live NYC Open Data call failed. Typical profile for a mid-size registered multiple dwelling.',
  hpd_registered: true,
  hpd: {
    total: 45,
    open: 8,
    open_by_class: { A: 2, B: 5, C: 1, I: 0 },
    last_24mo: 12,
    prior_24mo: 18,
    most_recent_inspection: null,
  },
  ecb: { total: 6, active: 1, active_by_severity: { 'CLASS - 2': 1 }, most_recent_issue: null },
  dob_complaints: { total: 10, active: 1, last_24mo: 3, most_recent: null, top_categories: [] },
  recent_items: [],
};

export const nycViolations: BuildingViolationsProvider = {
  name: 'NYC building violations (HPD + ECB + DOB via NYC Open Data)',

  async getViolations(addr: ResolvedAddress): Promise<ProviderResult<BuildingViolationsSummary>> {
    const fetched_at = new Date().toISOString();
    const parts = addr.bbl ? splitBbl(addr.bbl) : null;
    const bin = realBin(addr.bin);

    try {
      if (!parts && !bin) {
        throw new Error('Neither BBL nor a real BIN resolved — outside NYC coverage');
      }

      const hpdWhere = parts
        ? encodeURIComponent(`boroid=${parts.boroid} AND block=${parts.block} AND lot=${parts.lot}`)
        : null;
      // ECB keys on zero-padded boro/block/lot text (block 5-digit, lot
      // 4-digit) — but padding is inconsistent on old vintages, so match by
      // BIN OR lot to cover both.
      const ecbLotClause = parts
        ? `(boro='${parts.boroid}' AND block='${String(parts.block).padStart(5, '0')}' AND lot='${String(parts.lot).padStart(4, '0')}')`
        : null;
      const ecbBinClause = bin ? `(bin='${bin}')` : null;
      const ecbWhere =
        ecbLotClause || ecbBinClause
          ? encodeURIComponent([ecbBinClause, ecbLotClause].filter(Boolean).join(' OR '))
          : null;

      const [hpdRows, hpdRecent, regRows, ecbRows, dobRows] = await Promise.all([
        hpdWhere
          ? fetchJson<HpdRow[]>(
              `${HPD_VIOLATIONS}?$where=${hpdWhere}&$select=class,violationstatus,inspectiondate&$limit=10000`,
              { timeoutMs: 30000 },
            )
          : Promise.resolve([]),
        hpdWhere
          ? fetchJson<HpdRow[]>(
              `${HPD_VIOLATIONS}?$where=${hpdWhere}&$select=class,violationstatus,inspectiondate,novdescription&$order=inspectiondate DESC&$limit=5`,
            )
          : Promise.resolve([]),
        hpdWhere
          ? fetchJson<unknown[]>(`${HPD_REGISTRATIONS}?$where=${hpdWhere}&$limit=1`)
          : Promise.resolve([]),
        ecbWhere
          ? fetchJson<EcbRow[]>(
              `${ECB_VIOLATIONS}?$where=${ecbWhere}&$select=severity,ecb_violation_status,issue_date,violation_type,violation_description&$limit=2000`,
              { timeoutMs: 30000 },
            )
          : Promise.resolve([]),
        bin
          ? fetchJson<DobComplaintRow[]>(
              `${DOB_COMPLAINTS}?$where=${encodeURIComponent(`bin='${bin}'`)}&$select=status,date_entered,complaint_category&$limit=2000`,
              { timeoutMs: 30000 },
            )
          : Promise.resolve([]),
      ]);

      const cutoff24 = isoCutoff(24);
      const cutoff48 = isoCutoff(48);

      // --- HPD ---
      const openByClass: Record<'A' | 'B' | 'C' | 'I', number> = { A: 0, B: 0, C: 0, I: 0 };
      let hpdOpen = 0;
      let hpdLast24 = 0;
      let hpdPrior24 = 0;
      let hpdMostRecent: string | null = null;
      for (const r of hpdRows) {
        const open = (r.violationstatus ?? '').toLowerCase() === 'open';
        const date = r.inspectiondate?.slice(0, 10) ?? null;
        if (open) {
          hpdOpen++;
          const cls = (r.class ?? '') as 'A' | 'B' | 'C' | 'I';
          if (cls in openByClass) openByClass[cls]++;
        }
        if (date) {
          if (date > cutoff24) hpdLast24++;
          else if (date > cutoff48) hpdPrior24++;
          if (!hpdMostRecent || date > hpdMostRecent) hpdMostRecent = date;
        }
      }
      const hpdRegistered = regRows.length > 0;

      // --- ECB ---
      const activeBySeverity: Record<string, number> = {};
      let ecbActive = 0;
      let ecbMostRecent: string | null = null;
      for (const r of ecbRows) {
        const active = (r.ecb_violation_status ?? '').toUpperCase() === 'ACTIVE';
        if (active) {
          ecbActive++;
          const sev = r.severity ?? 'UNKNOWN';
          activeBySeverity[sev] = (activeBySeverity[sev] ?? 0) + 1;
        }
        const date = ecbDateToIso(r.issue_date);
        if (date && (!ecbMostRecent || date > ecbMostRecent)) ecbMostRecent = date;
      }

      // --- DOB complaints (dates windowed client-side: MM/DD/YYYY text) ---
      let dobActive = 0;
      let dobLast24 = 0;
      let dobMostRecent: string | null = null;
      const categoryCounts: Record<string, number> = {};
      for (const r of dobRows) {
        if ((r.status ?? '').toUpperCase() === 'ACTIVE') dobActive++;
        const date = dobDateToIso(r.date_entered);
        if (date) {
          if (date > cutoff24) dobLast24++;
          if (!dobMostRecent || date > dobMostRecent) dobMostRecent = date;
        }
        if (r.complaint_category) {
          categoryCounts[r.complaint_category] = (categoryCounts[r.complaint_category] ?? 0) + 1;
        }
      }
      const topCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([c]) => c);

      // --- recent items (UI ONLY — never into agent prompts) ---
      const recent: ViolationRecentItem[] = [
        ...hpdRecent.map((r): ViolationRecentItem => ({
          source: 'HPD',
          date: r.inspectiondate?.slice(0, 10) ?? '',
          label: `Class ${r.class ?? '?'} — ${(r.novdescription ?? '').slice(0, 120)}`,
          status: r.violationstatus ?? '',
        })),
        ...ecbRows
          .filter((r) => ecbDateToIso(r.issue_date))
          .sort((a, b) => (b.issue_date ?? '').localeCompare(a.issue_date ?? ''))
          .slice(0, 3)
          .map((r): ViolationRecentItem => ({
            source: 'ECB',
            date: ecbDateToIso(r.issue_date) ?? '',
            label: `${r.severity ?? ''} ${r.violation_type ?? ''} — ${(r.violation_description ?? '').slice(0, 120)}`.trim(),
            status: r.ecb_violation_status ?? '',
          })),
      ]
        .filter((r) => r.date)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 8);

      const binNote = bin
        ? `DOB complaints by BIN ${bin}`
        : 'DOB complaints skipped — no assigned BIN on this lot';
      const data: BuildingViolationsSummary = {
        bbl: addr.bbl,
        bin,
        scope_note: hpdRegistered
          ? `HPD-registered multiple dwelling (BBL ${addr.bbl}) — HPD + ECB by lot; ${binNote}.`
          : `Not an HPD-registered multiple dwelling — HPD covers rentals with 3+ units, so HPD zeros reflect coverage, not condition. ECB by lot; ${binNote}.`,
        hpd_registered: hpdRegistered,
        hpd: {
          total: hpdRows.length,
          open: hpdOpen,
          open_by_class: openByClass,
          last_24mo: hpdLast24,
          prior_24mo: hpdPrior24,
          most_recent_inspection: hpdMostRecent,
        },
        ecb: {
          total: ecbRows.length,
          active: ecbActive,
          active_by_severity: activeBySeverity,
          most_recent_issue: ecbMostRecent,
        },
        dob_complaints: {
          total: dobRows.length,
          active: dobActive,
          last_24mo: dobLast24,
          most_recent: dobMostRecent,
          top_categories: topCategories,
        },
        recent_items: recent,
      };

      return {
        ok: true,
        data,
        provenance: 'live',
        source: 'NYC Open Data — HPD violations (wvxf-dwi5), ECB violations (6bgk-3dad), DOB complaints (eabe-havv)',
        fetched_at,
      };
    } catch (e) {
      return {
        ok: true,
        data: REPRESENTATIVE_FALLBACK,
        provenance: 'representative',
        source: 'NYC building violations [FALLBACK]',
        fetched_at,
        error: `Live call failed: ${errMsg(e)}`,
      };
    }
  },
};
