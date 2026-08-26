// NYC entitlement track record — DOB Job Application Filings (ic3t-wcy2, legacy
// BIS). Entitlement is the highest-risk development stage; this reads the
// subject lot's filing history plus the community district's disposition track
// record (approvals, denials, withdrawals, stalls) and a typical filing
// timeline — the base rates that indicate whether a filing here gets built.

import type {
  EntitlementFilingItem,
  EntitlementProvider,
  EntitlementSummary,
  ProviderResult,
  ResolvedAddress,
} from '../types';
import { errMsg, fetchJson } from './http';
import { outOfMarketMunicipal } from './coverage';

const FILINGS = 'https://data.cityofnewyork.us/resource/ic3t-wcy2.json';
const PLUTO = 'https://data.cityofnewyork.us/resource/64uk-42ks.json';

const BORO_NAME: Record<string, string> = {
  '1': 'MANHATTAN',
  '2': 'BRONX',
  '3': 'BROOKLYN',
  '4': 'QUEENS',
  '5': 'STATEN ISLAND',
};

const TIMELINE_SAMPLE = 400;

interface StatusCountRow {
  job_status_descrp?: string;
  count_job__?: string;
}
interface FilingRow {
  job__?: string;
  job_type?: string;
  job_status_descrp?: string;
  latest_action_date?: string;
  pre__filing_date?: string;
}

type Bucket = 'approved' | 'disapproved' | 'withdrawn' | 'suspended' | 'in_process' | 'other';

// Classify a DOB job status into a disposition bucket by substring — robust to
// the dataset's many status strings.
function classify(status: string): Bucket {
  const s = status.toUpperCase();
  if (s.includes('DISAPPROVED')) return 'disapproved';
  if (s.includes('WITHDRAWN')) return 'withdrawn';
  if (s.includes('SUSPENDED')) return 'suspended';
  if (s.includes('SIGNED OFF') || s.includes('PERMIT ISSUED') || s.includes('APPROVED') || s.includes('COMPLETED') || s.includes('PROCESSED')) {
    return 'approved';
  }
  if (s.includes('IN PROCESS') || s.includes('ASSIGNED') || s.includes('PRE-FILING') || s.includes('PENDING')) {
    return 'in_process';
  }
  return 'other';
}

// MM/DD/YYYY → epoch ms (or null).
function parseDate(v?: string): number | null {
  if (!v) return null;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(v.trim());
  if (!m) return null;
  const t = Date.UTC(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  return Number.isFinite(t) ? t : null;
}
function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

const SCOPE_NOTE =
  'Community-district filing outcomes from DOB Job Application Filings (legacy BIS, ic3t-wcy2): a track record of historical dispositions, not a prediction. Approval ratio = approved ÷ (approved + disapproved).';

const REPRESENTATIVE_FALLBACK: EntitlementSummary = {
  subject_bbl: null,
  community_district: null,
  subject_filing_count: 0,
  cd_total_filings: 0,
  cd_approved: 0,
  cd_disapproved: 0,
  cd_withdrawn: 0,
  cd_suspended: 0,
  cd_in_process: 0,
  cd_approval_ratio_pct: null,
  cd_median_timeline_days: null,
  scope_note: 'REPRESENTATIVE: live DOB filings lookup failed. ' + SCOPE_NOTE,
  subject_recent_items: [],
};

export const nycDobFilings: EntitlementProvider = {
  name: 'NYC entitlement track record (DOB Job Application Filings ic3t-wcy2)',

  async getEntitlement(addr: ResolvedAddress): Promise<ProviderResult<EntitlementSummary>> {
    const fetched_at = new Date().toISOString();

    // Out of market: no NYC BBL → coverage-absent, never the representative
    // fallback (that is for a live call that FAILS on a real NYC BBL).
    if (!addr.bbl || !/^\d{10}$/.test(addr.bbl)) {
      return outOfMarketMunicipal<EntitlementSummary>({
        layer: 'DOB entitlement filings',
        dataset: 'NYC Open Data: DOB Job Application Filings (ic3t-wcy2)',
        fetched_at,
      });
    }

    try {
      const boroName = BORO_NAME[addr.bbl[0]];
      const block = Number(addr.bbl.slice(1, 6));
      const lot = Number(addr.bbl.slice(6));
      if (!boroName) throw new Error(`Bad BBL ${addr.bbl}`);
      const blockPad = String(block).padStart(5, '0');
      const lotPad = String(lot).padStart(5, '0');

      // Community district from PLUTO (independent of the zoning provider).
      // High retry count throughout: entitlement is the memo's highest-value
      // section, and a transient Socrata blip must not degrade an all-live
      // memo to representative. fetchJson backs off between attempts.
      const plutoRows = await fetchJson<{ cd?: string }[]>(
        `${PLUTO}?$where=${encodeURIComponent(`bbl='${Number(addr.bbl).toFixed(8)}'`)}&$select=cd&$limit=1`,
        { retries: 3 },
      );
      const cd = plutoRows[0]?.cd ?? null;

      // Subject-lot filings, the CD disposition mix, and a timeline sample — in parallel.
      const subjWhere = `borough='${boroName}' AND block='${blockPad}' AND lot='${lotPad}'`;
      const [subjectRows, statusRows, timelineRows] = await Promise.all([
        fetchJson<FilingRow[]>(
          `${FILINGS}?$where=${encodeURIComponent(subjWhere)}&$select=job__,job_type,job_status_descrp,latest_action_date&$order=latest_action_date DESC&$limit=25`,
          { timeoutMs: 30000, retries: 3 },
        ),
        cd
          ? fetchJson<StatusCountRow[]>(
              `${FILINGS}?$select=job_status_descrp,count(job__)&$where=${encodeURIComponent(`community___board='${cd}'`)}&$group=job_status_descrp&$limit=200`,
              { timeoutMs: 30000, retries: 3 },
            )
          : Promise.resolve([] as StatusCountRow[]),
        cd
          ? fetchJson<FilingRow[]>(
              `${FILINGS}?$where=${encodeURIComponent(`community___board='${cd}' AND job_status_descrp='SIGNED OFF'`)}&$select=pre__filing_date,latest_action_date&$order=latest_action_date DESC&$limit=${TIMELINE_SAMPLE}`,
              { timeoutMs: 30000, retries: 3 },
            )
          : Promise.resolve([] as FilingRow[]),
      ]);

      const counts: Record<Bucket, number> = {
        approved: 0,
        disapproved: 0,
        withdrawn: 0,
        suspended: 0,
        in_process: 0,
        other: 0,
      };
      let total = 0;
      for (const r of statusRows) {
        const n = Number(r.count_job__ ?? 0);
        total += n;
        counts[classify(r.job_status_descrp ?? '')] += n;
      }
      const approvalRatio =
        counts.approved + counts.disapproved > 0
          ? Math.round((counts.approved / (counts.approved + counts.disapproved)) * 100)
          : null;

      const durations: number[] = [];
      for (const r of timelineRows) {
        const start = parseDate(r.pre__filing_date);
        const end = parseDate(r.latest_action_date);
        if (start != null && end != null && end >= start) {
          durations.push(Math.round((end - start) / 86400000));
        }
      }

      const subject_recent_items: EntitlementFilingItem[] = subjectRows.map((r) => ({
        job: r.job__ ?? '',
        job_type: r.job_type ?? 'UNKNOWN',
        status: r.job_status_descrp ?? 'UNKNOWN',
        latest_action_date: r.latest_action_date ?? null,
      }));

      const data: EntitlementSummary = {
        subject_bbl: addr.bbl,
        community_district: cd,
        subject_filing_count: subjectRows.length,
        cd_total_filings: total,
        cd_approved: counts.approved,
        cd_disapproved: counts.disapproved,
        cd_withdrawn: counts.withdrawn,
        cd_suspended: counts.suspended,
        cd_in_process: counts.in_process,
        cd_approval_ratio_pct: approvalRatio,
        cd_median_timeline_days: median(durations),
        scope_note: SCOPE_NOTE,
        subject_recent_items,
      };

      return {
        ok: true,
        data,
        provenance: 'live',
        source: 'NYC Open Data: DOB Job Application Filings (ic3t-wcy2)',
        fetched_at,
      };
    } catch (e) {
      return {
        ok: true,
        data: REPRESENTATIVE_FALLBACK,
        provenance: 'fetch_failed',
        source: 'NYC Open Data: DOB Job Application Filings (ic3t-wcy2) [FALLBACK]',
        fetched_at,
        error: `Live call failed: ${errMsg(e)}`,
      };
    }
  },
};
