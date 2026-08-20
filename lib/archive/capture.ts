// KOANO archive — capture logic (Phase 0, first slice: sales + tract permits).
// Pure-ish functions the weekly cron and the integrity harness both call.
//
// CAPTURE VERSIONING (addition 2): every row records `capture_version`. When the
// capture logic changes in a year, bump the version so we always know which rows
// came from which logic — the same discipline as `verdicts.method`. Never reuse
// a version string after changing what/how a capture reads.
//
// APPEND-ONLY: every write is an upsert with ignoreDuplicates (INSERT ... ON
// CONFLICT DO NOTHING). The cron never updates or deletes a snapshot.

import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchJson } from '../providers/real/http';
import { registry } from '../providers/registry';
import type {
  BuildingViolationsSummary,
  ContaminationInfo,
  DisasterHistoryInfo,
  EmploymentInfo,
  EntitlementSummary,
  HpiTrend,
  LandlordPortfolioSummary,
  MortgageDemandInfo,
  ZoningInfo,
} from '../providers/types';

export const CAPTURE_VERSION = {
  sales: 'sales-incremental@1',
  permitsTract: 'permits-tract@1',
  entitlementCd: 'entitlement-cd@1',
  propertyViolations: 'property-violations@1',
  propertyLandlord: 'property-landlord@1',
  propertyFilings: 'property-filings@1',
  hpi: 'hpi-metro@1',
  zoning: 'zoning-property@1',
  // Phase 1 national providers (Slice 5): EPA proximity per-property (weekly);
  // disaster/HMDA/QCEW at county grain (capture-if-changed).
  contamination: 'contamination-property@1',
  disasterHistory: 'disaster-county@1',
  mortgageDemand: 'hmda-county@1',
  employment: 'qcew-county@1',
} as const;

const ROLLING_SALES = 'https://data.cityofnewyork.us/resource/usep-8jbt.json';
const DOB_PERMITS = 'https://data.cityofnewyork.us/resource/rbx6-tga4.json';
const DOB_FILINGS = 'https://data.cityofnewyork.us/resource/ic3t-wcy2.json';
const HPI_REF_ADDRESS = '1 Centre Street, New York, NY'; // resolves the NYC metro for HPI

// ISO-week Monday (UTC) for a date — the canonical captured_week / run_week.
export function isoWeekMonday(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay(); // 0=Sun … 6=Sat
  date.setUTCDate(date.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return date.toISOString().slice(0, 10);
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return `${d.toISOString().slice(0, 10)}T00:00:00.000`;
}

function hash(obj: unknown): string {
  return createHash('sha1').update(JSON.stringify(obj)).digest('hex');
}

async function chunkedUpsert(
  admin: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
): Promise<number> {
  let written = 0;
  for (let i = 0; i < rows.length; i += 1000) {
    const batch = rows.slice(i, i + 1000);
    const { error } = await admin.from(table).upsert(batch, { onConflict, ignoreDuplicates: true });
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
    written += batch.length;
  }
  return written;
}

// ---------------------------------------------------------------------------
// SALES — incremental accumulation. Re-query a wide rolling window (13 months,
// for overlap margin against late recordings) and upsert-ignore by natural key,
// so nothing is missed and duplicates are free. The first run seeds the whole
// current window; later runs only insert genuinely new sales.
// ---------------------------------------------------------------------------
interface SaleRow {
  borough?: string;
  block?: string;
  lot?: string;
  address?: string;
  zip_code?: string;
  neighborhood?: string;
  building_class_category?: string;
  residential_units?: string;
  gross_square_feet?: string;
  sale_price?: string;
  sale_date?: string;
}

export async function captureSales(admin: SupabaseClient, runWeek: string): Promise<number> {
  const cutoff = isoDaysAgo(400); // ~13 months
  const where = encodeURIComponent(`sale_price > 0 AND sale_date > '${cutoff}'`);
  const select = encodeURIComponent(
    'borough,block,lot,address,zip_code,neighborhood,building_class_category,residential_units,gross_square_feet,sale_price,sale_date',
  );
  const PAGE = 50000;
  const toInsert: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const url = `${ROLLING_SALES}?$where=${where}&$select=${select}&$order=sale_date DESC&$limit=${PAGE}&$offset=${offset}`;
    const rows = await fetchJson<SaleRow[]>(url, { timeoutMs: 60000 });
    for (const r of rows) {
      const sale_date = (r.sale_date ?? '').slice(0, 10);
      if (!sale_date) continue;
      const borough = r.borough ?? '';
      const block = r.block ?? '';
      const lot = r.lot ?? '';
      const price = r.sale_price ?? '';
      const gsf = r.gross_square_feet ?? '';
      const cls = r.building_class_category ?? '';
      const bbl =
        borough && block && lot ? `${borough}${block.padStart(5, '0')}${lot.padStart(4, '0')}` : null;
      toInsert.push({
        natural_key: `${borough}|${block}|${lot}|${sale_date}|${price}|${gsf}|${cls}`,
        bbl,
        borough,
        block,
        lot,
        address: r.address ?? null,
        zip: r.zip_code ?? null,
        neighborhood: r.neighborhood ?? null,
        building_class: cls || null,
        residential_units: r.residential_units ? Number(r.residential_units) : null,
        gross_square_feet: gsf ? Number(gsf) : null,
        sale_price: price ? Number(price) : null,
        sale_date,
        captured_week: runWeek,
        source: 'NYC Open Data — DOF Rolling Calendar Sales (usep-8jbt)',
        capture_version: CAPTURE_VERSION.sales,
      });
    }
    if (rows.length < PAGE) break;
  }
  // ignoreDuplicates → only new natural_keys land; the count returned is rows
  // ATTEMPTED (not net-new). The run's plausibility floor is what guards "wrote
  // nothing": an empty attempt means the source query broke.
  return chunkedUpsert(admin, 'sales_archive', toInsert, 'natural_key');
}

// ---------------------------------------------------------------------------
// TRACT PERMITS — state snapshot, all NYC tracts in a handful of GROUP queries
// (Socrata aggregates server-side, so this is ~5 queries, not ~2,325 calls).
// scope_key = 'BOROUGH:census_tract' — lossless. Note: DOB strips the tract code
// (137.00 -> "137", 119.01 -> "11901") irreversibly, so this is NOT a Census
// GEOID; joining tract-permits to ACS/other tract data later needs a crosswalk.
// ---------------------------------------------------------------------------
interface TractCount {
  census_tract?: string;
  borough?: string;
  cnt?: string;
}

async function tractGroup(where: string): Promise<Map<string, number>> {
  const url =
    `${DOB_PERMITS}?$select=census_tract,borough,count(1) as cnt` +
    `&$where=${encodeURIComponent(`${where} AND census_tract IS NOT NULL AND borough IS NOT NULL`)}` +
    `&$group=census_tract,borough&$limit=50000`;
  const rows = await fetchJson<TractCount[]>(url, { timeoutMs: 60000 });
  const m = new Map<string, number>();
  for (const r of rows) {
    if (!r.census_tract || !r.borough) continue;
    m.set(`${r.borough.toUpperCase()}:${r.census_tract}`, Number(r.cnt ?? 0));
  }
  return m;
}

export async function captureTractPermits(admin: SupabaseClient, runWeek: string): Promise<number> {
  const c24 = `issued_date > '${isoDaysAgo(730)}'`;
  const c7 = `issued_date > '${isoDaysAgo(7)}'`;
  // Generous payload captured NOW (past rows can never gain fields).
  const [total, newB, demo, alt, last7] = await Promise.all([
    tractGroup(c24),
    tractGroup(`${c24} AND upper(work_type) like '%NEW BUILDING%'`),
    tractGroup(`${c24} AND upper(work_type) like '%DEMOLITION%'`),
    tractGroup(
      `${c24} AND (upper(work_type) like '%ALTERATION%' OR upper(work_type) like '%GENERAL CONSTRUCTION%' OR upper(work_type) like '%PLUMBING%')`,
    ),
    tractGroup(c7),
  ]);

  const keys = new Set<string>(Array.from(total.keys()).concat(Array.from(last7.keys())));
  const rows: Record<string, unknown>[] = [];
  for (const key of Array.from(keys)) {
    const [borough, census_tract] = key.split(':');
    const data = {
      borough,
      census_tract, // agency-native (DOB-stripped); GEOID needs a crosswalk
      total_24mo: total.get(key) ?? 0,
      new_building_24mo: newB.get(key) ?? 0,
      demolition_24mo: demo.get(key) ?? 0,
      alteration_24mo: alt.get(key) ?? 0,
      issued_last_7d: last7.get(key) ?? 0,
    };
    rows.push({
      dataset: 'permits',
      scope_type: 'tract',
      scope_key: key,
      captured_week: runWeek,
      source: 'NYC Open Data — DOB NOW: Build Approved Permits (rbx6-tga4)',
      provenance: 'live',
      capture_version: CAPTURE_VERSION.permitsTract,
      data,
      row_count: data.total_24mo,
      content_hash: hash(data),
    });
  }
  return chunkedUpsert(admin, 'archive_snapshots', rows, 'dataset,scope_type,scope_key,captured_week');
}

// ---------------------------------------------------------------------------
// Missed-run detection — a silently broken job is the failure that destroys the
// thesis, so each run checks that the PRIOR week captured successfully.
// ---------------------------------------------------------------------------
export async function priorWeekMissing(admin: SupabaseClient, runWeek: string): Promise<string | null> {
  const prior = isoWeekMonday(new Date(new Date(runWeek).getTime() - 7 * 86_400_000));
  const captured = await admin.from('archive_runs').select('id').eq('run_week', prior).eq('status', 'succeeded').limit(1);
  if (captured.data && captured.data.length > 0) return null; // prior week was captured

  // GENESIS GUARD: a missing prior week is only a real gap if we were ALREADY
  // archiving before it (a succeeded run earlier than `prior` exists). On first
  // setup, weeks before the first-ever run had nothing to capture — do NOT alert,
  // or a spurious gap email on day one teaches the operator to ignore the one
  // mechanism protecting the asset.
  const earlier = await admin
    .from('archive_runs')
    .select('run_week')
    .eq('status', 'succeeded')
    .lt('run_week', prior)
    .limit(1);
  return earlier.data && earlier.data.length > 0 ? prior : null;
}

// Best-effort email on a missed run. Uses Resend's HTTP API (no SDK) when
// configured; otherwise logs LOUDLY so the gap is at least in the logs. Requires
// RESEND_API_KEY + ARCHIVE_ALERT_FROM + ARCHIVE_ALERT_TO.
export async function sendGapAlert(subject: string, body: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ARCHIVE_ALERT_FROM;
  const to = process.env.ARCHIVE_ALERT_TO;
  if (!key || !from || !to) {
    console.error(`[archive] GAP ALERT (email not configured): ${subject} — ${body}`);
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, text: body }),
    });
    if (!res.ok) console.error(`[archive] gap-alert email failed (${res.status}): ${await res.text()}`);
  } catch (e) {
    console.error(`[archive] gap-alert email threw: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ===========================================================================
// SLICE 2 — widening the archive additively.
// ===========================================================================

// The content_hash of the most recent snapshot for a scope — used by the
// capture-if-changed datasets (zoning version bumps, quarterly HPI) so we snapshot
// only when the source actually moved, not every week.
async function lastHash(admin: SupabaseClient, dataset: string, scopeType: string, scopeKey: string): Promise<string | null> {
  const { data } = await admin
    .from('archive_snapshots')
    .select('content_hash')
    .eq('dataset', dataset).eq('scope_type', scopeType).eq('scope_key', scopeKey)
    .order('captured_week', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.content_hash as string) ?? null;
}

export interface TrackedProperty { address: string; bbl: string | null }

export async function loadTrackedProperties(admin: SupabaseClient): Promise<TrackedProperty[]> {
  const { data } = await admin.from('properties').select('address_normalized, address_input, bbl');
  const seen = new Set<string>();
  const out: TrackedProperty[] = [];
  for (const p of data ?? []) {
    const address = (p.address_normalized as string) ?? (p.address_input as string);
    const key = (p.bbl as string) ?? address;
    if (!address || seen.has(key)) continue;
    seen.add(key);
    out.push({ address, bbl: (p.bbl as string) ?? null });
  }
  return out;
}

// --- CD ENTITLEMENT (weekly, all NYC community districts) -------------------
// Disposition mix + approval ratio per CD, from DOB Job Application Filings.
// NOTE: median filing timeline is NOT captured at CD scale — Socrata has no
// median aggregate, and pulling every filing weekly to compute it is not worth
// it. The per-property filings snapshot carries subject timelines where it matters.
function entitlementBucket(s: string): 'approved' | 'disapproved' | 'withdrawn' | 'suspended' | 'in_process' | 'other' {
  const u = (s ?? '').toUpperCase();
  if (u.includes('DISAPPROVED')) return 'disapproved'; // before APPROVED — DISAPPROVED contains it
  if (u.includes('WITHDRAWN')) return 'withdrawn';
  if (u.includes('SUSPENDED')) return 'suspended';
  if (u.includes('SIGNED OFF') || u.includes('PERMIT ISSUED') || u.includes('APPROVED') || u.includes('COMPLETED') || u.includes('PROCESSED')) return 'approved';
  if (u.includes('PLAN EXAM') || u.includes('ASSIGNED') || u.includes('PRE-FILING') || u.includes('PENDING') || u.includes('IN PROCESS')) return 'in_process';
  return 'other';
}

export async function captureCdEntitlement(admin: SupabaseClient, runWeek: string): Promise<number> {
  const url = `${DOB_FILINGS}?$select=community___board,job_status_descrp,count(1) as c&$group=community___board,job_status_descrp&$limit=50000`;
  const rows = await fetchJson<{ community___board?: string; job_status_descrp?: string; c?: string }[]>(url, { timeoutMs: 60000 });
  const perCd = new Map<string, Record<string, number>>();
  for (const r of rows) {
    const cd = r.community___board;
    if (!cd || cd === '000') continue;
    const b = entitlementBucket(r.job_status_descrp ?? '');
    const agg = perCd.get(cd) ?? { approved: 0, disapproved: 0, withdrawn: 0, suspended: 0, in_process: 0, other: 0, total: 0 };
    agg[b] += Number(r.c ?? 0);
    agg.total += Number(r.c ?? 0);
    perCd.set(cd, agg);
  }
  const out: Record<string, unknown>[] = [];
  for (const [cd, agg] of Array.from(perCd.entries())) {
    const decided = agg.approved + agg.disapproved;
    const data = {
      community_district: cd,
      approved: agg.approved, disapproved: agg.disapproved, withdrawn: agg.withdrawn,
      suspended: agg.suspended, in_process: agg.in_process, other: agg.other, total: agg.total,
      approval_ratio_pct: decided > 0 ? Math.round((agg.approved / decided) * 100) : null,
      median_timeline_days: null, // not aggregatable at CD scale (see note above)
    };
    out.push({
      dataset: 'entitlement_cd', scope_type: 'community_district', scope_key: cd, captured_week: runWeek,
      source: 'NYC Open Data — DOB Job Application Filings (ic3t-wcy2)', provenance: 'live',
      capture_version: CAPTURE_VERSION.entitlementCd, data, row_count: agg.total, content_hash: hash(data),
    });
  }
  return chunkedUpsert(admin, 'archive_snapshots', out, 'dataset,scope_type,scope_key,captured_week');
}

// --- PER-PROPERTY (weekly): violations, landlord/ownership, subject filings;
//     zoning is capture-if-changed. Geocodes each property once. Only LIVE
//     provider results are archived (never a representative fallback).
//     Chunking is designed-for but NOT built (tracked N is small): a future
//     `offset/limit` on `props` slices this across invocations.
export interface PropertyCaptureCounts { violations: number; landlord: number; filings: number; zoning: number; contamination: number; disaster: number; hmda: number; qcew: number }

export async function capturePropertySnapshots(admin: SupabaseClient, runWeek: string, props: TrackedProperty[]): Promise<PropertyCaptureCounts> {
  const violations: Record<string, unknown>[] = [];
  const landlord: Record<string, unknown>[] = [];
  const filings: Record<string, unknown>[] = [];
  const zoning: Record<string, unknown>[] = [];
  const contamination: Record<string, unknown>[] = [];
  // County-level datasets are deduped across properties and captured after the
  // loop (many tracked properties share a county). Collected here as resolved
  // addresses keyed by county FIPS.
  const countyByFips = new Map<string, { addr: import('../providers/types').ResolvedAddress }>();

  for (const p of props) {
    let geo;
    try { geo = await registry.geocode.resolve(p.address); } catch { continue; }
    if (!geo.ok || !geo.data) continue;
    const bbl = geo.data.bbl ?? p.bbl;
    if (!bbl) continue;
    if (geo.data.state_fips && geo.data.county_fips) {
      countyByFips.set(`${geo.data.state_fips}${geo.data.county_fips}`, { addr: geo.data });
    }
    // EPA contamination proximity — 2 FRS calls/property. The FRS enforces
    // 12 req/min; with a small tracked N this stays under, but a larger fleet
    // needs throttling/chunking here (designed-for, not built).
    const [v, l, e, z, cont] = await Promise.all([
      registry.buildingViolations.getViolations(geo.data).catch(() => null),
      registry.landlordPortfolio.getPortfolio(geo.data).catch(() => null),
      registry.entitlement.getEntitlement(geo.data).catch(() => null),
      registry.zoning.getZoning(geo.data).catch(() => null),
      registry.contamination.getContamination(geo.data).catch(() => null),
    ]);

    if (cont && cont.provenance === 'live' && cont.data) {
      const d = cont.data as ContaminationInfo;
      const data = {
        radius_mi: d.radius_mi, superfund_sites_within_radius: d.superfund_sites_within_radius,
        brownfield_within_radius: d.brownfield_within_radius, total_cleanup_sites_within_radius: d.total_cleanup_sites_within_radius,
        nearest_site_name: d.nearest_site_name, nearest_site_distance_mi: d.nearest_site_distance_mi, nearest_site_program: d.nearest_site_program,
      };
      contamination.push({ dataset: 'contamination', scope_type: 'property', scope_key: bbl, captured_week: runWeek, source: cont.source, provenance: 'live', capture_version: CAPTURE_VERSION.contamination, data, row_count: d.total_cleanup_sites_within_radius, content_hash: hash(data) });
    }

    if (v && v.provenance === 'live' && v.data) {
      const d = v.data as BuildingViolationsSummary;
      const data = {
        hpd_open: d.hpd.open, hpd_total: d.hpd.total, hpd_open_by_class: d.hpd.open_by_class,
        ecb_active: d.ecb.active, ecb_total: d.ecb.total,
        dob_active: d.dob_complaints.active, dob_total: d.dob_complaints.total,
        hpd_registered: d.hpd_registered,
      };
      violations.push({ dataset: 'violations', scope_type: 'property', scope_key: bbl, captured_week: runWeek, source: v.source, provenance: 'live', capture_version: CAPTURE_VERSION.propertyViolations, data, row_count: d.hpd.total, content_hash: hash(data) });
    }
    if (l && l.provenance === 'live' && l.data) {
      const d = l.data as LandlordPortfolioSummary;
      const data = {
        registered_owner: d.registered_owner, owner_type: d.owner_type, management_company: d.management_company,
        portfolio_building_count: d.portfolio_building_count, portfolio_open_hpd_violations: d.portfolio_open_hpd_violations,
        portfolio_total_hpd_violations: d.portfolio_total_hpd_violations, on_speculation_watch_list: d.on_speculation_watch_list,
        hpd_registered: d.hpd_registered,
      };
      landlord.push({ dataset: 'landlord', scope_type: 'property', scope_key: bbl, captured_week: runWeek, source: l.source, provenance: 'live', capture_version: CAPTURE_VERSION.propertyLandlord, data, content_hash: hash(data) });
    }
    if (e && e.provenance === 'live' && e.data) {
      const d = e.data as EntitlementSummary;
      const data = {
        community_district: d.community_district, subject_filing_count: d.subject_filing_count,
        subject_recent_items: d.subject_recent_items,
      };
      filings.push({ dataset: 'filings', scope_type: 'property', scope_key: bbl, captured_week: runWeek, source: e.source, provenance: 'live', capture_version: CAPTURE_VERSION.propertyFilings, data, row_count: d.subject_filing_count, content_hash: hash(data) });
    }
    // ZONING — capture only on a version bump (content change).
    if (z && z.provenance === 'live' && z.data) {
      const d = z.data as ZoningInfo;
      const data = {
        zoning_district: d.zoning_district, commercial_overlay: d.commercial_overlay, special_district: d.special_district,
        built_far: d.built_far, max_residential_far: d.max_residential_far, max_affordable_residential_far: d.max_affordable_residential_far,
        unused_far_pct: d.unused_far_pct, building_class: d.building_class, land_use_code: d.land_use_code,
        residential_units: d.residential_units, assessed_total_usd: d.assessed_total_usd,
      };
      const h = hash(data);
      if (h !== (await lastHash(admin, 'zoning', 'property', bbl))) {
        zoning.push({ dataset: 'zoning', scope_type: 'property', scope_key: bbl, captured_week: runWeek, source: z.source, provenance: 'live', capture_version: CAPTURE_VERSION.zoning, data, content_hash: h });
      }
    }
  }

  // County-level national datasets (deduped): disaster history, HMDA lending,
  // QCEW employment. All capture-if-changed — they move slowly (disaster
  // declarations irregular, HMDA annual, QCEW quarterly), so a content-hash
  // dedupe avoids redundant weekly rows while still capturing every real change.
  const disaster: Record<string, unknown>[] = [];
  const hmda: Record<string, unknown>[] = [];
  const qcew: Record<string, unknown>[] = [];
  for (const [fips, { addr }] of Array.from(countyByFips.entries())) {
    const [dh, mh, qh] = await Promise.all([
      registry.disasterHistory.getDisasterHistory(addr).catch(() => null),
      registry.mortgageDemand.getMortgageDemand(addr).catch(() => null),
      registry.employment.getEmployment(addr).catch(() => null),
    ]);
    if (dh && dh.provenance === 'live' && dh.data) {
      const d = dh.data as DisasterHistoryInfo;
      const data = { total_declarations: d.total_declarations, declarations_last_10yr: d.declarations_last_10yr, distinct_incident_types: d.distinct_incident_types, most_common_incident: d.most_common_incident, most_recent_declaration: d.most_recent_declaration };
      const h = hash(data);
      if (h !== (await lastHash(admin, 'disaster_history', 'county', fips))) {
        disaster.push({ dataset: 'disaster_history', scope_type: 'county', scope_key: fips, captured_week: runWeek, source: dh.source, provenance: 'live', capture_version: CAPTURE_VERSION.disasterHistory, data, row_count: d.total_declarations, content_hash: h });
      }
    }
    if (mh && mh.provenance === 'live' && mh.data) {
      const d = mh.data as MortgageDemandInfo;
      const data = { year: d.year, originations: d.originations, denials: d.denials, denial_rate_pct: d.denial_rate_pct, originations_yoy_pct: d.originations_yoy_pct };
      const h = hash(data);
      if (h !== (await lastHash(admin, 'mortgage_demand', 'county', fips))) {
        hmda.push({ dataset: 'mortgage_demand', scope_type: 'county', scope_key: fips, captured_week: runWeek, source: mh.source, provenance: 'live', capture_version: CAPTURE_VERSION.mortgageDemand, data, row_count: d.originations, content_hash: h });
      }
    }
    if (qh && qh.provenance === 'live' && qh.data) {
      const d = qh.data as EmploymentInfo;
      const data = { period: d.period, total_employment: d.total_employment, avg_weekly_wage_usd: d.avg_weekly_wage_usd, employment_yoy_pct: d.employment_yoy_pct, avg_weekly_wage_yoy_pct: d.avg_weekly_wage_yoy_pct, establishments: d.establishments };
      const h = hash(data);
      if (h !== (await lastHash(admin, 'employment', 'county', fips))) {
        qcew.push({ dataset: 'employment', scope_type: 'county', scope_key: fips, captured_week: runWeek, source: qh.source, provenance: 'live', capture_version: CAPTURE_VERSION.employment, data, row_count: d.total_employment ?? 0, content_hash: h });
      }
    }
  }

  const oc = 'dataset,scope_type,scope_key,captured_week';
  return {
    violations: await chunkedUpsert(admin, 'archive_snapshots', violations, oc),
    landlord: await chunkedUpsert(admin, 'archive_snapshots', landlord, oc),
    filings: await chunkedUpsert(admin, 'archive_snapshots', filings, oc),
    zoning: await chunkedUpsert(admin, 'archive_snapshots', zoning, oc),
    contamination: await chunkedUpsert(admin, 'archive_snapshots', contamination, oc),
    disaster: await chunkedUpsert(admin, 'archive_snapshots', disaster, oc),
    hmda: await chunkedUpsert(admin, 'archive_snapshots', hmda, oc),
    qcew: await chunkedUpsert(admin, 'archive_snapshots', qcew, oc),
  };
}

// --- HPI — metro, capture-if-changed (quarterly cadence in practice). ---------
export async function captureHpiIfChanged(admin: SupabaseClient, runWeek: string): Promise<number> {
  const geo = await registry.geocode.resolve(HPI_REF_ADDRESS);
  if (!geo.ok || !geo.data) return 0;
  const res = await registry.hpi.getHpi(geo.data);
  if (res.provenance !== 'live' || !res.data) return 0;
  const d = res.data as HpiTrend;
  const data = { region: d.region, region_type: d.region_type, latest_period: d.latest_period, latest_index: d.latest_index, yoy_change_pct: d.yoy_change_pct, five_yr_change_pct: d.five_yr_change_pct };
  const scopeKey = d.region;
  const h = hash(data);
  if (h === (await lastHash(admin, 'hpi', 'metro', scopeKey))) return 0; // unchanged quarter
  return chunkedUpsert(
    admin, 'archive_snapshots',
    [{ dataset: 'hpi', scope_type: 'metro', scope_key: scopeKey, captured_week: runWeek, source: res.source, provenance: 'live', capture_version: CAPTURE_VERSION.hpi, data, content_hash: h }],
    'dataset,scope_type,scope_key,captured_week',
  );
}

// ACS (annual, all-NYC-tract) is DEFERRED: it needs the CENSUS_API_KEY (often
// unset -> representative, which must NOT be archived) and a bulk multi-tract
// Census query distinct from the per-address provider. Tracked as its own task
// so we never archive representative demographics.
