// NYC DOB NOW: Build — Job Application Filings (w9ak-ipjd). Phase 0.
//
// What a job filing adds that the approved-permits feed (rbx6-tga4) does not:
// the JOB TYPE as DOB classifies it (New Building, Full Demolition, Alteration,
// ALT-CO, No Work) and the filing's current status, so the engine can tell a
// ground-up job in progress on the subject lot from neighbourhood activity.
//
//   - The subject lot (by BBL): every New Building and Full Demolition job, and
//     whether it is still ACTIVE (any status short of completion, withdrawal or
//     denial). An active one feeds the construction guard (direction.ts).
//   - The census tract (DOB tract code + borough), last 24 months by filing
//     date: New Building and Full Demolition job counts with the subject lot's
//     own jobs EXCLUDED, so a site's own redevelopment never reads as
//     neighbourhood pipeline.
//
// Omission over fabrication: a non-NYC address is coverage_absent; a failed
// live call returns data:null tagged fetch_failed.

import type { JobFilingsProvider, JobFilingsSummary, JobFiling, ProviderResult, ResolvedAddress } from '../types';
import { errMsg, fetchJson } from './http';
import { outOfMarketMunicipal } from './coverage';

const DATASET = 'https://data.cityofnewyork.us/resource/w9ak-ipjd.json';
const LABEL = 'NYC Open Data, DOB NOW: Build Job Application Filings (w9ak-ipjd)';

interface Row {
  job_filing_number?: string;
  job_type?: string;
  filing_status?: string;
  filing_date?: string;
  house_no?: string;
  street_name?: string;
}

// A filing is no longer in progress once DOB has closed it out one way or
// another: a letter of completion or certificate of occupancy, a demolition
// sign-off, a withdrawal, a denial. Everything else (approved, permit entire,
// permit issued, objections, plan review, on hold) is active.
const CLOSED = /loc issued|co issued|signed-off|signed off|withdrawn|denied|disapproved|certificate of operation/i;

export function classifyJob(jobType: string | undefined): JobFiling['kind'] {
  const t = (jobType ?? '').trim().toLowerCase();
  if (t === 'new building') return 'new_building';
  if (t === 'full demolition') return 'demolition';
  return 'other';
}

export function isActiveFiling(status: string | undefined): boolean {
  return !!status && !CLOSED.test(status);
}

// DOB's census_tract drops leading zeros and a ".00" suffix (same rule as the
// permits provider): 011901 -> "11901", 013700 -> "137".
function dobTract(code: string | null | undefined): string | null {
  if (!code) return null;
  return String(Number(code.slice(0, -2))) + (code.slice(-2) === '00' ? '' : code.slice(-2));
}

function titleBorough(b: string | null | undefined): string | null {
  if (!b) return null;
  return b.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export const nycDobNowJobs: JobFilingsProvider = {
  name: 'NYC DOB NOW Job Application Filings (NYC Open Data)',

  async getJobFilings(addr: ResolvedAddress): Promise<ProviderResult<JobFilingsSummary>> {
    const fetched_at = new Date().toISOString();
    if (!addr.bbl) {
      return outOfMarketMunicipal<JobFilingsSummary>({ layer: 'DOB NOW job filings', dataset: `${LABEL}`, fetched_at });
    }
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 24);
    const cutoffStr = `${cutoff.toISOString().slice(0, 10)}T00:00:00.000`;
    const tract = dobTract(addr.tract_code);
    const borough = titleBorough(addr.borough);
    const groundUp = `job_type in('New Building','Full Demolition')`;

    const subjectUrl =
      `${DATASET}?$select=job_filing_number,job_type,filing_status,filing_date,house_no,street_name` +
      `&$where=${encodeURIComponent(`bbl='${addr.bbl}' AND ${groundUp}`)}&$order=filing_date%20DESC&$limit=50`;
    // Rows, not a grouped count: DOB lists each filing stage of a job (-I1,
    // -S1, -P1 ...) as its own row, so jobs are counted distinct below.
    const tractUrl =
      tract && borough
        ? `${DATASET}?$select=job_filing_number,job_type&$where=${encodeURIComponent(
            `census_tract='${tract}' AND borough='${borough}' AND ${groundUp} AND filing_date > '${cutoffStr}' AND bbl != '${addr.bbl}'`,
          )}&$limit=5000`
        : null;

    try {
      const [subjectRows, tractCounts] = await Promise.all([
        fetchJson<Row[]>(subjectUrl),
        tractUrl ? fetchJson<Row[]>(tractUrl, { timeoutMs: 45000 }) : Promise.resolve(null),
      ]);
      // Newest first with undated rows last, so the first row per job is its latest stage.
      subjectRows.sort((a, b) => (b.filing_date ?? '').localeCompare(a.filing_date ?? ''));
      // A job number can appear once per filing stage (-I1, -S1 ...); keep the latest per job.
      const byJob = new Map<string, JobFiling>();
      for (const r of subjectRows) {
        const job = (r.job_filing_number ?? '').split('-')[0];
        if (!job || byJob.has(job)) continue;
        byJob.set(job, {
          job_filing_number: r.job_filing_number ?? job,
          job_type: r.job_type ?? '',
          kind: classifyJob(r.job_type),
          filing_status: r.filing_status ?? '',
          active: isActiveFiling(r.filing_status),
          filing_date: (r.filing_date ?? '').slice(0, 10),
          address: `${r.house_no ?? ''} ${r.street_name ?? ''}`.trim(),
        });
      }
      const subject = Array.from(byJob.values());
      const distinctJobs = (kind: JobFiling['kind']) =>
        new Set((tractCounts ?? []).filter((r) => classifyJob(r.job_type) === kind).map((r) => (r.job_filing_number ?? '').split('-')[0])).size;
      const data: JobFilingsSummary = {
        subject_jobs: subject,
        subject_active_new_building: subject.filter((j) => j.active && j.kind === 'new_building').length,
        subject_active_demolition: subject.filter((j) => j.active && j.kind === 'demolition').length,
        tract_new_building_jobs_24mo: tractCounts ? distinctJobs('new_building') : null,
        tract_demolition_jobs_24mo: tractCounts ? distinctJobs('demolition') : null,
        scope_note: tractCounts
          ? `New Building and Full Demolition job filings: the subject lot (BBL ${addr.bbl}, all dates) and census tract ${tract}, ${borough} (filed in the last 24 months, the subject lot excluded)`
          : `New Building and Full Demolition job filings on the subject lot (BBL ${addr.bbl}); the census tract did not resolve, so no neighbourhood count`,
      };
      return { ok: true, data, provenance: 'live', source: LABEL, endpoint: tractUrl ?? subjectUrl, fetched_at };
    } catch (e) {
      return {
        ok: true,
        data: null,
        provenance: 'fetch_failed',
        source: `${LABEL} [live call failed]`,
        endpoint: subjectUrl,
        fetched_at,
        error: `Live call failed: ${errMsg(e)}`,
      };
    }
  },
};
