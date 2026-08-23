// NYC DOB NOW: Build — Approved Permits — NYC Open Data SODA API (rbx6-tga4).
// Live queries: subject property by BBL + neighborhood activity by census tract.
// Falls back to a labeled representative response on failure.

import type {
  PermitsProvider,
  PermitsSummary,
  PermitMonth,
  PermitRecord,
  ProviderResult,
  ResolvedAddress,
} from '../types';
import { errMsg, fetchJson } from './http';

const DATASET = 'https://data.cityofnewyork.us/resource/rbx6-tga4.json';
// Legacy DOB Permit Issuance — covers permits filed before DOB NOW (pre-2021)
// through the changeover. Keyed on BIN (bin__). Carries expiration_date, which
// DOB NOW's approved-permits feed does not, so it drives the expired flag.
const LEGACY_DATASET = 'https://data.cityofnewyork.us/resource/ipu4-2q9a.json';

interface DobNowPermit {
  work_type?: string;
  filing_reason?: string;
  permit_status?: string;
  issued_date?: string;
  house_no?: string;
  street_name?: string;
  borough?: string;
}

interface LegacyPermit {
  job_type?: string;
  work_type?: string;
  permit_type?: string;
  permit_status?: string;
  filing_status?: string;
  issuance_date?: string; // MM/DD/YYYY
  expiration_date?: string; // MM/DD/YYYY
  house__?: string;
  street_name?: string;
  borough?: string;
}

function toRecord(p: DobNowPermit): PermitRecord {
  return {
    job_type: p.work_type ?? p.filing_reason ?? 'UNKNOWN',
    work_type: p.work_type ?? null,
    permit_status: p.permit_status ?? null,
    issuance_date: p.issued_date ?? '',
    address: `${p.house_no ?? ''} ${p.street_name ?? ''}`.trim(),
    borough: p.borough ?? '',
  };
}

// MM/DD/YYYY or ISO → yyyy-mm-dd (empty string if unparseable), so the merged
// history sorts and displays consistently across the two datasets.
function normalizeDate(d: string | undefined): string {
  if (!d) return '';
  const mdy = d.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (mdy) return `${mdy[3]}-${mdy[1]}-${mdy[2]}`;
  const iso = d.match(/^(\d{4}-\d{2}-\d{2})/);
  return iso ? iso[1] : '';
}

function dobNowToHistory(p: DobNowPermit): PermitRecord {
  return {
    job_type: p.work_type ?? p.filing_reason ?? 'UNKNOWN',
    work_type: p.work_type ?? null,
    permit_status: p.permit_status ?? null,
    issuance_date: normalizeDate(p.issued_date),
    address: `${p.house_no ?? ''} ${p.street_name ?? ''}`.trim(),
    borough: p.borough ?? '',
    expiration_date: null,
    dataset: 'DOB NOW',
  };
}

function legacyToHistory(p: LegacyPermit): PermitRecord {
  return {
    job_type: p.job_type ?? 'UNKNOWN',
    work_type: p.work_type ?? p.permit_type ?? null,
    permit_status: p.permit_status ?? p.filing_status ?? null,
    issuance_date: normalizeDate(p.issuance_date),
    address: `${p.house__ ?? ''} ${p.street_name ?? ''}`.trim(),
    borough: p.borough ?? '',
    expiration_date: normalizeDate(p.expiration_date) || null,
    dataset: 'DOB legacy',
  };
}

function countBy(rows: DobNowPermit[], match: (wt: string) => boolean): number {
  return rows.filter((p) => match((p.work_type ?? '').toLowerCase())).length;
}

// Bucket permit rows into the last 24 calendar months (zero-filled, chronological),
// keyed "YYYY-MM" off each row's issued_date. The scope is the same rows the
// aggregate counts use (census tract when available, else subject BBL), so the
// trend and the totals always agree.
function monthlySeries(rows: DobNowPermit[]): PermitMonth[] {
  const now = new Date();
  const buckets = new Map<string, number>();
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, 0);
  }
  for (const p of rows) {
    const key = normalizeDate(p.issued_date).slice(0, 7);
    if (key && buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([month, count]) => ({ month, count }));
}

const REPRESENTATIVE_FALLBACK: PermitsSummary = {
  bin: null,
  scope_note:
    'REPRESENTATIVE — live NYC Open Data call failed. Typical 24-month permit profile for an active-development Brooklyn tract.',
  total_permits_24mo: 350,
  new_building_permits: 12,
  demolition_permits: 6,
  alteration_permits: 240,
  monthly_permits: [],
  recent_permits: [],
  all_permits: [],
  all_permits_note:
    'REPRESENTATIVE — live NYC Open Data call failed; no subject permit history retrieved.',
};

// DOB NOW: Build began rolling out in 2021 and does not contain most permits
// filed before it. A short or empty subject list is a coverage fact, not proof
// no work was ever done — the report states this so a legitimate zero is honest.
const DOB_NOW_COVERAGE_NOTE =
  'History merges two NYC DOB sources: DOB NOW: Build (rbx6-tga4, permits filed roughly 2021 onward, matched on BBL) and the legacy DOB Permit Issuance dataset (ipu4-2q9a, older permits, matched on BIN). ' +
  'Both are permits DOB issued; neither captures work done entirely without a permit, so a short or empty history is a record of what was filed, not proof that no other work occurred.';

export const nycPermits: PermitsProvider = {
  name: 'NYC DOB NOW Approved Permits (NYC Open Data)',

  async getPermits(addr: ResolvedAddress): Promise<ProviderResult<PermitsSummary>> {
    const fetched_at = new Date().toISOString();
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 24);
    const cutoffStr = `${cutoff.toISOString().slice(0, 10)}T00:00:00.000`;

    // DOB census_tract drops leading zeros AND the trailing ".00" suffix of a
    // whole-number tract: tract 119.01 -> "11901", but tract 137.00 -> "137".
    // String(Number("013700")) = "13700" keeps the trailing zeros, matches
    // NOTHING, and silently falls the query back to the subject BBL's own count
    // (which read 0 "neighborhood permits" for whole-number tracts). Split off
    // the 2-digit suffix and drop it only when it is "00".
    const dobTract = addr.tract_code
      ? String(Number(addr.tract_code.slice(0, -2))) +
        (addr.tract_code.slice(-2) === '00' ? '' : addr.tract_code.slice(-2))
      : null;
    const boroughWhere = addr.borough ? `upper(borough)=upper('${addr.borough}')` : null;

    const subjectUrl =
      `${DATASET}?$where=${encodeURIComponent(`bbl='${addr.bbl}' AND issued_date > '${cutoffStr}'`)}` +
      `&$order=issued_date%20DESC&$limit=100`;
    // Subject-BBL permit history, ALL available dates (no 24-month cutoff) for
    // the Permit History Report. Separate from the counts above so agent inputs
    // (total_permits_24mo, recent_permits) are untouched — determinism preserved.
    const subjectHistoryUrl = addr.bbl
      ? `${DATASET}?$where=${encodeURIComponent(`bbl='${addr.bbl}'`)}&$order=issued_date%20DESC&$limit=300`
      : null;
    const realBin = addr.bin && !/^\d0{6}$/.test(addr.bin) ? addr.bin : null;
    const legacyHistoryUrl = realBin
      ? `${LEGACY_DATASET}?$where=${encodeURIComponent(`bin__='${realBin}'`)}&$order=issuance_date%20DESC&$limit=300`
      : null;
    const tractUrl =
      dobTract && boroughWhere
        ? `${DATASET}?$where=${encodeURIComponent(
            `census_tract='${dobTract}' AND ${boroughWhere} AND issued_date > '${cutoffStr}'`
          )}&$order=issued_date%20DESC&$limit=2000`
        : null;

    try {
      const [subjectRows, tractRows, subjectHistoryRows, legacyHistoryRows] = await Promise.all([
        addr.bbl ? fetchJson<DobNowPermit[]>(subjectUrl) : Promise.resolve([]),
        tractUrl ? fetchJson<DobNowPermit[]>(tractUrl, { timeoutMs: 45000 }) : Promise.resolve([]),
        subjectHistoryUrl
          ? fetchJson<DobNowPermit[]>(subjectHistoryUrl, { timeoutMs: 45000 })
          : Promise.resolve([]),
        legacyHistoryUrl
          ? fetchJson<LegacyPermit[]>(legacyHistoryUrl, { timeoutMs: 45000 })
          : Promise.resolve([]),
      ]);

      // Merged subject-building history (DOB NOW + legacy), newest first, ≤300.
      const allPermits: PermitRecord[] = [
        ...subjectHistoryRows.map(dobNowToHistory),
        ...legacyHistoryRows.map(legacyToHistory),
      ]
        .filter((r) => r.issuance_date)
        .sort((a, b) => b.issuance_date.localeCompare(a.issuance_date))
        .slice(0, 300);

      if (subjectRows.length === 0 && tractRows.length === 0 && !addr.bbl && !tractUrl) {
        throw new Error('Neither BBL nor census tract resolved — nothing to query');
      }

      const scope = tractRows.length > 0 ? tractRows : subjectRows;
      const data: PermitsSummary = {
        bin: addr.bin,
        scope_note:
          tractRows.length > 0
            ? `Census tract ${dobTract}, ${addr.borough} — permits issued last 24 months (${tractRows.length} in tract; ${subjectRows.length} on subject BBL ${addr.bbl})`
            : `Subject BBL ${addr.bbl} — permits issued last 24 months`,
        total_permits_24mo: scope.length,
        new_building_permits: countBy(scope, (wt) => wt.includes('new building')),
        demolition_permits: countBy(scope, (wt) => wt.includes('demolition')),
        alteration_permits: countBy(
          scope,
          (wt) => wt.includes('alteration') || wt.includes('general construction') || wt.includes('plumbing')
        ),
        monthly_permits: monthlySeries(scope),
        recent_permits: [...subjectRows.slice(0, 5), ...tractRows.slice(0, 5)].map(toRecord),
        all_permits: allPermits,
        all_permits_note: DOB_NOW_COVERAGE_NOTE,
      };

      return {
        ok: true,
        data,
        provenance: 'live',
        source:
          'NYC Open Data — DOB permits (DOB NOW: Build rbx6-tga4 + legacy DOB Permit Issuance ipu4-2q9a)',
        endpoint: tractUrl ?? subjectUrl,
        fetched_at,
      };
    } catch (e) {
      return {
        ok: true,
        data: REPRESENTATIVE_FALLBACK,
        provenance: 'representative',
        source: 'NYC Open Data — DOB NOW Approved Permits [FALLBACK]',
        endpoint: subjectUrl,
        fetched_at,
        error: `Live call failed: ${errMsg(e)}`,
      };
    }
  },
};
