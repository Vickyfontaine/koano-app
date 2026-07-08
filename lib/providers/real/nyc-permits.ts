// NYC DOB NOW: Build — Approved Permits — NYC Open Data SODA API (rbx6-tga4).
// Live queries: subject property by BBL + neighborhood activity by census tract.
// Falls back to a labeled representative response on failure.

import type { PermitsProvider, PermitsSummary, PermitRecord, ProviderResult, ResolvedAddress } from '../types';
import { errMsg, fetchJson } from './http';

const DATASET = 'https://data.cityofnewyork.us/resource/rbx6-tga4.json';

interface DobNowPermit {
  work_type?: string;
  filing_reason?: string;
  permit_status?: string;
  issued_date?: string;
  house_no?: string;
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

function countBy(rows: DobNowPermit[], match: (wt: string) => boolean): number {
  return rows.filter((p) => match((p.work_type ?? '').toLowerCase())).length;
}

const REPRESENTATIVE_FALLBACK: PermitsSummary = {
  bin: null,
  scope_note:
    'REPRESENTATIVE — live NYC Open Data call failed. Typical 24-month permit profile for an active-development Brooklyn tract.',
  total_permits_24mo: 350,
  new_building_permits: 12,
  demolition_permits: 6,
  alteration_permits: 240,
  recent_permits: [],
};

export const nycPermits: PermitsProvider = {
  name: 'NYC DOB NOW Approved Permits (NYC Open Data)',

  async getPermits(addr: ResolvedAddress): Promise<ProviderResult<PermitsSummary>> {
    const fetched_at = new Date().toISOString();
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 24);
    const cutoffStr = `${cutoff.toISOString().slice(0, 10)}T00:00:00.000`;

    // DOB census_tract has no leading zeros: "011901" -> "11901"
    const dobTract = addr.tract_code ? String(Number(addr.tract_code)) : null;
    const boroughWhere = addr.borough ? `upper(borough)=upper('${addr.borough}')` : null;

    const subjectUrl =
      `${DATASET}?$where=${encodeURIComponent(`bbl='${addr.bbl}' AND issued_date > '${cutoffStr}'`)}` +
      `&$order=issued_date%20DESC&$limit=100`;
    const tractUrl =
      dobTract && boroughWhere
        ? `${DATASET}?$where=${encodeURIComponent(
            `census_tract='${dobTract}' AND ${boroughWhere} AND issued_date > '${cutoffStr}'`
          )}&$order=issued_date%20DESC&$limit=2000`
        : null;

    try {
      const [subjectRows, tractRows] = await Promise.all([
        addr.bbl ? fetchJson<DobNowPermit[]>(subjectUrl) : Promise.resolve([]),
        tractUrl ? fetchJson<DobNowPermit[]>(tractUrl, { timeoutMs: 45000 }) : Promise.resolve([]),
      ]);

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
        recent_permits: [...subjectRows.slice(0, 5), ...tractRows.slice(0, 5)].map(toRecord),
      };

      return {
        ok: true,
        data,
        provenance: 'live',
        source: 'NYC Open Data — DOB NOW Build Approved Permits (rbx6-tga4)',
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
