// Landlord portfolios — live NYC Open Data (SODA):
//   HPD Multiple Dwelling Registrations (tesw-yqqr) — subject registration
//   HPD Registration Contacts (feu5-w2e2) — registered owner / managing agent
//   HPD Violations (wvxf-dwi5) — portfolio violation volume (aggregated)
//   Speculation Watch List (adax-9mit) — subject BBL membership
//
// v1 is EXACT entity matching only (uppercase/trim, quotes escaped). No fuzzy
// matching and no LLC-variant resolution, so portfolios held through
// one-LLC-per-building structures are undercounted — every summary carries
// that caveat. This is ownership records and violation patterns, NOT
// harassment records or eviction filings. Falls back to a labeled
// representative response (with an obviously generic owner label, never an
// invented realistic name) on failure.

import type {
  LandlordPortfolioProvider,
  LandlordPortfolioSummary,
  PortfolioBuilding,
  ProviderResult,
  ResolvedAddress,
} from '../types';
import { errMsg, fetchJson } from './http';

const REGISTRATIONS = 'https://data.cityofnewyork.us/resource/tesw-yqqr.json';
const CONTACTS = 'https://data.cityofnewyork.us/resource/feu5-w2e2.json';
const HPD_VIOLATIONS = 'https://data.cityofnewyork.us/resource/wvxf-dwi5.json';
const SPECULATION_WATCH = 'https://data.cityofnewyork.us/resource/adax-9mit.json';

const MAX_REGISTRATIONS = 50; // portfolio scan cap
const MAX_BUILDINGS_DETAILED = 25; // buildings listed + violation-aggregated

const MATCH_CAVEAT =
  'Exact-match on the registered entity name only (v1): portfolios held through separate LLCs per building are undercounted. Ownership as registered with HPD; registrations lag reality.';

interface RegistrationRow {
  registrationid?: string;
  boroid?: string;
  block?: string;
  lot?: string;
  housenumber?: string;
  streetname?: string;
  zip?: string;
  lastregistrationdate?: string;
}
interface ContactRow {
  registrationid?: string;
  type?: string;
  corporationname?: string;
  firstname?: string;
  lastname?: string;
}
interface ViolationAggRow {
  boroid?: string;
  block?: string;
  lot?: string;
  count_violationid?: string;
}

function bblOf(r: RegistrationRow): string | null {
  if (!r.boroid || !r.block || !r.lot) return null;
  return `${r.boroid}${r.block.padStart(5, '0')}${r.lot.padStart(4, '0')}`;
}

function soqlEscape(s: string): string {
  return s.replace(/'/g, "''");
}

const REPRESENTATIVE_FALLBACK: LandlordPortfolioSummary = {
  subject_bbl: null,
  hpd_registered: true,
  registered_owner: 'REPRESENTATIVE — live ownership lookup failed',
  owner_type: null,
  management_company: null,
  portfolio_building_count: 8,
  portfolio_truncated: false,
  portfolio_open_hpd_violations: 60,
  portfolio_total_hpd_violations: 220,
  on_speculation_watch_list: false,
  match_caveat: MATCH_CAVEAT,
  buildings: [],
};

export const nycLandlord: LandlordPortfolioProvider = {
  name: 'NYC landlord portfolios (HPD registrations/contacts + Speculation Watch List)',

  async getPortfolio(addr: ResolvedAddress): Promise<ProviderResult<LandlordPortfolioSummary>> {
    const fetched_at = new Date().toISOString();

    try {
      if (!addr.bbl || !/^\d{10}$/.test(addr.bbl)) {
        throw new Error('No BBL resolved — outside NYC coverage');
      }
      const boroid = Number(addr.bbl[0]);
      const block = Number(addr.bbl.slice(1, 6));
      const lot = Number(addr.bbl.slice(6));
      const lotWhere = encodeURIComponent(`boroid=${boroid} AND block=${block} AND lot=${lot}`);

      // Speculation Watch List runs regardless of registration status.
      const watchPromise = fetchJson<unknown[]>(
        `${SPECULATION_WATCH}?$where=${encodeURIComponent(`bbl=${Number(addr.bbl)}`)}&$limit=1`,
      );

      // 1. Subject registration (most recent).
      const regRows = await fetchJson<RegistrationRow[]>(
        `${REGISTRATIONS}?$where=${lotWhere}&$order=lastregistrationdate DESC&$limit=1`,
      );

      if (regRows.length === 0 || !regRows[0].registrationid) {
        const onWatch = (await watchPromise).length > 0;
        return {
          ok: true,
          data: {
            subject_bbl: addr.bbl,
            hpd_registered: false,
            registered_owner: null,
            owner_type: null,
            management_company: null,
            portfolio_building_count: 0,
            portfolio_truncated: false,
            portfolio_open_hpd_violations: 0,
            portfolio_total_hpd_violations: 0,
            on_speculation_watch_list: onWatch,
            match_caveat:
              'Not an HPD-registered multiple dwelling (HPD registration covers rentals with 3+ units) — no registered-owner record exists to resolve. ' +
              MATCH_CAVEAT,
            buildings: [],
          },
          provenance: 'live',
          source:
            'NYC Open Data — HPD registrations (tesw-yqqr), contacts (feu5-w2e2), Speculation Watch List (adax-9mit)',
          fetched_at,
        };
      }
      const registrationId = regRows[0].registrationid;

      // 2. Contacts → owner entity + managing agent. Filter types server-side:
      // large registrations carry one SiteManager row per building and would
      // otherwise flood any row limit before the owner rows appear.
      const contacts = await fetchJson<ContactRow[]>(
        `${CONTACTS}?$where=${encodeURIComponent(
          `registrationid=${registrationId} AND type in('CorporateOwner','IndividualOwner','HeadOfficer','Officer','Agent')`,
        )}&$limit=100`,
      );
      const byType = (t: string) => contacts.filter((c) => (c.type ?? '') === t);
      const corp = byType('CorporateOwner').find((c) => c.corporationname);
      const indiv =
        byType('IndividualOwner').find((c) => c.firstname && c.lastname) ??
        byType('HeadOfficer').find((c) => c.firstname && c.lastname);
      const agent = byType('Agent').find((c) => c.corporationname);

      const ownerIsCorp = !!corp;
      const ownerName = ownerIsCorp
        ? corp!.corporationname!.trim().toUpperCase()
        : indiv
          ? `${indiv.firstname!.trim().toUpperCase()} ${indiv.lastname!.trim().toUpperCase()}`
          : null;
      const ownerType = ownerIsCorp ? 'CorporateOwner' : indiv ? (indiv.type ?? null) : null;

      // 3. Portfolio: exact-match the owner entity across all contacts.
      let portfolioRegIds: string[] = [registrationId];
      let truncated = false;
      if (ownerName) {
        const matchWhere = ownerIsCorp
          ? `type='CorporateOwner' AND upper(corporationname)='${soqlEscape(ownerName)}'`
          : `type in('IndividualOwner','HeadOfficer') AND upper(firstname)='${soqlEscape(indiv!.firstname!.trim().toUpperCase())}' AND upper(lastname)='${soqlEscape(indiv!.lastname!.trim().toUpperCase())}'`;
        const SCAN_LIMIT = 1000;
        const matches = await fetchJson<ContactRow[]>(
          `${CONTACTS}?$where=${encodeURIComponent(matchWhere)}&$select=registrationid&$limit=${SCAN_LIMIT}`,
          { timeoutMs: 30000 },
        );
        const ids = Array.from(
          new Set(matches.map((m) => m.registrationid).filter((x): x is string => !!x)),
        );
        // Saturated scans and id caps both mean "floor, not ceiling" — flagged.
        truncated = ids.length > MAX_REGISTRATIONS || matches.length >= SCAN_LIMIT;
        portfolioRegIds = ids.slice(0, MAX_REGISTRATIONS);
        if (!portfolioRegIds.includes(registrationId)) portfolioRegIds.push(registrationId);
      }

      // 4. Buildings for those registrations (one row per building; large
      // registrations span many rows, so saturation here is also flagged).
      const REG_LIMIT = 1000;
      const regWhere = encodeURIComponent(`registrationid in(${portfolioRegIds.join(',')})`);
      const buildingRows = await fetchJson<RegistrationRow[]>(
        `${REGISTRATIONS}?$where=${regWhere}&$limit=${REG_LIMIT}`,
        { timeoutMs: 30000 },
      );
      if (buildingRows.length >= REG_LIMIT) truncated = true;
      const buildingsAll = buildingRows
        .map((r) => ({
          bbl: bblOf(r),
          address: `${r.housenumber ?? ''} ${r.streetname ?? ''}`.trim(),
          zip: r.zip ?? null,
          boroid: r.boroid,
          block: r.block,
          lot: r.lot,
        }))
        .filter((b, i, arr) => b.bbl && arr.findIndex((x) => x.bbl === b.bbl) === i);
      const detailed = buildingsAll.slice(0, MAX_BUILDINGS_DETAILED);
      const detailTruncated = buildingsAll.length > MAX_BUILDINGS_DETAILED;

      // 5. Portfolio violation volume — aggregated per lot in chunks of 25.
      const openByBbl = new Map<string, number>();
      let portfolioTotal = 0;
      let portfolioOpen = 0;
      for (let i = 0; i < detailed.length; i += 25) {
        const chunk = detailed.slice(i, i + 25);
        const orClause = chunk
          .map((b) => `(boroid=${Number(b.boroid)} AND block=${Number(b.block)} AND lot=${Number(b.lot)})`)
          .join(' OR ');
        const [totalRows, openRows] = await Promise.all([
          fetchJson<ViolationAggRow[]>(
            `${HPD_VIOLATIONS}?$select=boroid,block,lot,count(violationid)&$where=${encodeURIComponent(orClause)}&$group=boroid,block,lot&$limit=100`,
            { timeoutMs: 30000 },
          ),
          fetchJson<ViolationAggRow[]>(
            `${HPD_VIOLATIONS}?$select=boroid,block,lot,count(violationid)&$where=${encodeURIComponent(`(${orClause}) AND violationstatus='Open'`)}&$group=boroid,block,lot&$limit=100`,
            { timeoutMs: 30000 },
          ),
        ]);
        for (const r of totalRows) portfolioTotal += Number(r.count_violationid ?? 0);
        for (const r of openRows) {
          const bbl = r.boroid && r.block && r.lot
            ? `${r.boroid}${r.block.padStart(5, '0')}${r.lot.padStart(4, '0')}`
            : null;
          const n = Number(r.count_violationid ?? 0);
          portfolioOpen += n;
          if (bbl) openByBbl.set(bbl, n);
        }
      }

      const buildings: PortfolioBuilding[] = detailed.map((b) => ({
        bbl: b.bbl,
        address: b.address,
        zip: b.zip,
        open_hpd_violations: openByBbl.get(b.bbl!) ?? 0,
      }));

      const onWatch = (await watchPromise).length > 0;

      const data: LandlordPortfolioSummary = {
        subject_bbl: addr.bbl,
        hpd_registered: true,
        registered_owner: ownerName,
        owner_type: ownerType,
        management_company: agent?.corporationname?.trim().toUpperCase() ?? null,
        portfolio_building_count: buildingsAll.length,
        portfolio_truncated: truncated || detailTruncated,
        portfolio_open_hpd_violations: portfolioOpen,
        portfolio_total_hpd_violations: portfolioTotal,
        on_speculation_watch_list: onWatch,
        match_caveat:
          (truncated || detailTruncated
            ? `Portfolio scan capped at ${MAX_REGISTRATIONS} registrations / ${MAX_BUILDINGS_DETAILED} buildings detailed — counts are a floor, not a ceiling. `
            : '') + MATCH_CAVEAT,
        buildings,
      };

      return {
        ok: true,
        data,
        provenance: 'live',
        source:
          'NYC Open Data — HPD registrations (tesw-yqqr), contacts (feu5-w2e2), violations (wvxf-dwi5), Speculation Watch List (adax-9mit)',
        fetched_at,
      };
    } catch (e) {
      return {
        ok: true,
        data: REPRESENTATIVE_FALLBACK,
        provenance: 'representative',
        source: 'NYC landlord portfolio [FALLBACK]',
        fetched_at,
        error: `Live call failed: ${errMsg(e)}`,
      };
    }
  },
};
