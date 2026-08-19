// KOANO document engine — Violation & Ownership Record (Community).
// Evidentiary, dense, citable. Handed to a lawyer, a buyer, or a tenant
// advocate, it must list EVERY recorded violation with its ID, class/severity,
// status, and date, then the registered owner, their agent, their other
// buildings, and their portfolio-wide violation volume and speculation-watch
// status. Completeness beats page discipline here: there is no page target and
// the full-record table runs to whatever length the data requires. Visible
// trimming exists only as an extreme safety valve (>200 items) and is a NOTE,
// never a silent cut. All-live NYC data; zero model calls (fully deterministic).
//
// HONESTY POSTURE: HPD violations cover only registered multiple dwellings
// (3+ residential units). When a building is not HPD-registered, a zero is a
// COVERAGE fact, not a clean record — the report says so prominently so an
// absence of violations is never mistaken for proof of none.

import type {
  ZoningInfo,
  BuildingViolationsSummary,
  LandlordPortfolioSummary,
  ViolationRecentItem,
} from '../../providers/types';
import type { DocumentData, Letterhead } from '../types';
import type { RenderModel, RenderSection } from '../render/model';

// Extreme safety valve only. Clay Ave's ~78 items are all shown; this bounds a
// pathological portfolio, and any cut is surfaced as a visible trim note.
const MAX_RECORD_ROWS = 200;
const MAX_PORTFOLIO_ROWS = 60;

function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString('en-US');
}

export interface ViolationRecordFacts {
  addressLabel: string;
  bbl: string | null;
  bin: string | null;
  buildingClass: string | null;
  yearBuilt: number | null;
  residentialUnits: number | null;
  hpdRegistered: boolean;
  scopeNote: string;
  hpd: BuildingViolationsSummary['hpd'];
  ecb: BuildingViolationsSummary['ecb'];
  dob: BuildingViolationsSummary['dob_complaints'];
  allItems: ViolationRecentItem[];
  totalItems: number; // pre-trim count (all_items is already ≤250 at provider)
  // Ownership
  registeredOwner: string | null;
  ownerAddress: string | null;
  ownerType: string | null;
  managementCompany: string | null;
  portfolioBuildingCount: number;
  portfolioTruncated: boolean;
  portfolioOpen: number;
  portfolioTotal: number;
  onWatchList: boolean;
  matchCaveat: string;
  buildings: LandlordPortfolioSummary['buildings'];
}

export function extractViolationRecordFacts(
  data: DocumentData,
): { ok: true; facts: ViolationRecordFacts } | { ok: false; error: string } {
  const viol = data.blocks.building_violations?.data as BuildingViolationsSummary | null | undefined;
  const port = data.blocks.landlord_portfolio?.data as LandlordPortfolioSummary | null | undefined;
  const zoning = data.blocks.zoning?.data as ZoningInfo | null | undefined;

  if (!viol) return { ok: false, error: 'Building violation data unavailable for this address.' };
  if (!port) return { ok: false, error: 'Ownership / landlord registration data unavailable for this address.' };

  return {
    ok: true,
    facts: {
      addressLabel: data.resolved_address.normalized || data.resolved_address.input,
      bbl: data.resolved_address.bbl,
      bin: viol.bin,
      buildingClass: zoning?.building_class ?? null,
      yearBuilt: zoning?.year_built ?? null,
      residentialUnits: zoning?.residential_units ?? null,
      hpdRegistered: viol.hpd_registered,
      scopeNote: viol.scope_note,
      hpd: viol.hpd,
      ecb: viol.ecb,
      dob: viol.dob_complaints,
      allItems: viol.all_items,
      totalItems: viol.all_items.length,
      registeredOwner: port.registered_owner,
      ownerAddress: port.registered_owner_address,
      ownerType: port.owner_type,
      managementCompany: port.management_company,
      portfolioBuildingCount: port.portfolio_building_count,
      portfolioTruncated: port.portfolio_truncated,
      portfolioOpen: port.portfolio_open_hpd_violations,
      portfolioTotal: port.portfolio_total_hpd_violations,
      onWatchList: port.on_speculation_watch_list,
      matchCaveat: port.match_caveat,
      buildings: port.buildings,
    },
  };
}

function openByClassLine(byClass: Record<'A' | 'B' | 'C' | 'I', number>): string {
  const parts = (['A', 'B', 'C', 'I'] as const)
    .filter((c) => byClass[c] > 0)
    .map((c) => `Class ${c}: ${byClass[c]}`);
  return parts.length ? parts.join(', ') : 'none open';
}

// Fully deterministic — the builder is pure, no model call, no route argument.
export function buildViolationRecordModel(args: {
  facts: ViolationRecordFacts;
  letterhead: Letterhead;
  appendix: RenderModel['appendix'];
  generatedAt: string;
}): RenderModel {
  const { facts: f, letterhead, appendix, generatedAt } = args;
  const sections: RenderSection[] = [];

  // 1 — Building identity.
  sections.push({
    heading: 'Building Identity',
    band: {
      items: [
        { label: 'Address', value: f.addressLabel },
        { label: 'BBL', value: f.bbl ?? '—' },
        { label: 'BIN', value: f.bin ?? '—' },
        { label: 'Building class', value: f.buildingClass ?? '—' },
        { label: 'Year built', value: f.yearBuilt ? String(f.yearBuilt) : '—' },
        { label: 'Residential units', value: f.residentialUnits != null ? fmtInt(f.residentialUnits) : '—' },
      ],
    },
  });

  // 2 — Coverage note (the honesty gate on a zero).
  const coverageParas: string[] = [];
  if (f.hpdRegistered) {
    coverageParas.push(
      'This building is registered with HPD as a multiple dwelling (3 or more residential units), so HPD Housing Maintenance Code violations are within coverage and the counts below are the recorded record.',
    );
  } else {
    coverageParas.push(
      'This building is NOT registered with HPD as a multiple dwelling. HPD only records Housing Maintenance Code violations for registered buildings with 3 or more residential units, so an HPD count of zero here reflects that this building is outside HPD coverage — it is not evidence of a clean maintenance record. ECB and DOB records below apply regardless of HPD registration.',
    );
  }
  coverageParas.push(`Scope: ${f.scopeNote}`);
  sections.push({
    heading: 'Coverage & How to Read This Record',
    provenanceNote: {
      provenance: 'live',
      text: 'HPD, ECB, and DOB records pulled live from NYC Open Data at generation time.',
    },
    paragraphs: coverageParas,
  });

  // 3 — Registered ownership.
  sections.push({
    heading: 'Registered Ownership',
    table: {
      columns: ['Field', 'Value'],
      rows: [
        ['Registered owner', f.registeredOwner ?? '— (no HPD registration on file)'],
        ['Owner type', f.ownerType ?? '—'],
        ['Registered owner address', f.ownerAddress ?? '—'],
        ['Managing agent', f.managementCompany ?? '—'],
        ['On NYC speculation watch list', f.onWatchList ? 'YES' : 'No'],
      ],
      caption: `Source: NYC HPD Multiple Dwelling Registrations. ${f.matchCaveat}`,
    },
  });

  // 4 — Portfolio-wide violation volume + the owner's other buildings.
  sections.push({
    heading: "Owner Portfolio — Violation Volume",
    table: {
      columns: ['Portfolio metric', 'Value'],
      rows: [
        ['Distinct buildings under this owner (exact match)', fmtInt(f.portfolioBuildingCount)],
        ['Open HPD violations across the portfolio', fmtInt(f.portfolioOpen)],
        ['Total HPD violations across the portfolio', fmtInt(f.portfolioTotal)],
      ],
      caption: f.portfolioTruncated
        ? 'Portfolio counts are capped for size; the true portfolio may be larger (see note below).'
        : 'Exact-entity match; the true portfolio may be larger where the owner files under name variants.',
    },
  });

  if (f.buildings.length > 0) {
    const shown = f.buildings.slice(0, MAX_PORTFOLIO_ROWS);
    const buildingsSection: RenderSection = {
      heading: "Buildings in This Owner's Portfolio",
      table: {
        columns: ['Address', 'ZIP', 'Open HPD violations'],
        rows: shown.map((b) => [b.address, b.zip ?? '—', fmtInt(b.open_hpd_violations)]),
        caption:
          'Every building registered to the same owner entity (the subject property included). Higher open-violation counts across a portfolio can indicate a pattern.',
      },
    };
    if (f.buildings.length > shown.length) {
      buildingsSection.trimNote = `Showing ${shown.length} of ${f.buildings.length} buildings in this owner's portfolio; the remainder are omitted for length.`;
    }
    sections.push(buildingsSection);
  }

  // 5 — Violation summary counts.
  sections.push({
    heading: 'Violation Summary',
    table: {
      columns: ['Agency', 'Open / Active', 'Total', 'Detail'],
      rows: [
        ['HPD (Housing Maintenance Code)', fmtInt(f.hpd.open), fmtInt(f.hpd.total), openByClassLine(f.hpd.open_by_class)],
        ['ECB (Environmental Control Board)', fmtInt(f.ecb.active), fmtInt(f.ecb.total), f.ecb.most_recent_issue ? `most recent ${f.ecb.most_recent_issue}` : '—'],
        ['DOB complaints', fmtInt(f.dob.active), fmtInt(f.dob.total), f.dob.most_recent ? `most recent ${f.dob.most_recent}` : '—'],
      ],
      caption: 'Open/Active counts are the live, currently-unresolved records; Total includes closed/resolved history.',
    },
  });

  // 6 — The full, citable record. Completeness beats page discipline.
  if (f.allItems.length === 0) {
    sections.push({
      heading: 'Full Violation Record',
      paragraphs: [
        f.hpdRegistered
          ? 'No individual HPD, ECB, or DOB violation records were returned for this building at generation time.'
          : 'No individual ECB or DOB violation records were returned for this building, and it is outside HPD coverage (see the coverage note above). This is not a certification of no issues.',
      ],
    });
  } else {
    const shown = f.allItems.slice(0, MAX_RECORD_ROWS);
    const recordSection: RenderSection = {
      heading: 'Full Violation Record',
      table: {
        columns: ['Date', 'Agency', 'Violation ID', 'Status', 'Description'],
        rows: shown.map((v) => [
          v.date || '—',
          v.source,
          v.violation_id ?? '—',
          v.status || '—',
          v.label,
        ]),
        caption: `Every recorded HPD, ECB, and DOB violation for this building, newest first (${fmtInt(f.totalItems)} record${f.totalItems === 1 ? '' : 's'}). Each row is citable by its violation ID.`,
      },
    };
    if (f.allItems.length > shown.length) {
      recordSection.trimNote = `SAFETY-VALVE TRIM: showing the ${shown.length} most recent of ${fmtInt(f.allItems.length)} records. The remaining ${fmtInt(f.allItems.length - shown.length)} are omitted for document length only — request the full extract for a complete filing.`;
    }
    sections.push(recordSection);
  }

  return {
    docTitle: 'Violation & Ownership Record',
    subtitle: f.addressLabel,
    letterhead,
    compact: true, // dense, evidentiary
    sections,
    appendix,
    generatedAt,
  };
}
