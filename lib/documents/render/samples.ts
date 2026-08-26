// Representative RenderModels for the disclaimer regression harness.
// One entry per implemented document type, plus a STRESS model that forces
// multi-page output and a page-spanning table — the exact shape that surfaced
// the lineHeight footer-drop bug.
//
// CONTRACT: every IMPLEMENTED_DOC_TYPES entry MUST have a SAMPLE_MODELS entry.
// The harness fails otherwise, so no document type can ship without
// disclaimer-on-every-page coverage. When you build a new type, add its sample
// here (deterministic — no live data, no model call).

import type { RenderModel, RenderSection } from './model';
import type { Letterhead } from '../types';

// Fixed timestamp so renders are deterministic (no Date.now()).
const GENERATED_AT = '2026-01-01T00:00:00.000Z';

const NAMED_LETTERHEAD: Letterhead = {
  full_name: 'Jane Homeowner',
  company_name: 'Coastal Realty Partners',
  license_number: 'NY-10401234',
  phone: '(212) 555-0142',
  contact_email: 'jane@coastalrp.example',
  logo_url: null,
  headshot_url: null,
};

const EMPTY_LETTERHEAD: Letterhead = {
  full_name: null,
  company_name: null,
  license_number: null,
  phone: null,
  contact_email: null,
  logo_url: null,
  headshot_url: null,
};

// A representative tax appeal packet (all-live provenance).
function taxAppealSample(): RenderModel {
  const comps = Array.from({ length: 8 }, (_, i) => [
    `${100 + i} Example Street`,
    `2025-0${(i % 9) + 1}-15`,
    `$${(850000 + i * 15000).toLocaleString('en-US')}`,
    `$${(600 + i * 7).toLocaleString('en-US')}`,
    `${(1200 + i * 40).toLocaleString('en-US')}`,
  ]);
  return {
    docTitle: 'Property Tax Appeal Evidence Packet',
    subtitle: '175 3rd Street, Brooklyn, NY',
    letterhead: NAMED_LETTERHEAD,
    sections: [
      {
        heading: 'Assessment Summary',
        table: {
          columns: ['Field', 'Value'],
          rows: [
            ['DOF total assessed value', '$4,185,900'],
            ['Assessed land value', '$3,261,600'],
            ['Building area', '13,518 sq ft'],
            ['Building class', 'K4'],
            ['Year built', '1931'],
            ['BBL', '3009720058'],
          ],
          caption: 'Source: NYC DOF assessment roll via MapPLUTO (live).',
        },
      },
      {
        heading: 'Comparable Recorded Sales',
        provenanceNote: { provenance: 'live', text: 'Recorded sales pulled live from NYC DOF Rolling Sales.' },
        table: {
          columns: ['Address', 'Sale date', 'Sale price', '$/sq ft', 'Sq ft'],
          rows: comps,
          caption: '144 qualifying recorded sales in scope (showing 8). ZIP-keyed proximity.',
        },
      },
      {
        heading: 'Indicative Value vs. Assessment',
        paragraphs: [
          'Indicative market value from recorded comparable sales: $15,626,808 ($1,156/sq ft median × 13,518 sq ft).',
          'DOF total assessed value: $4,185,900. The assessed value is a class-dependent fraction of DOF market value; compare the indicative value against the market value on your DOF Notice of Property Value.',
        ],
      },
      {
        heading: 'Basis for Appeal',
        paragraphs: [
          'The recorded comparable sales indicate a market value that should be weighed against the market value the Department of Finance assigned on the Notice of Property Value. '.repeat(3),
        ],
      },
    ],
    appendix: {
      overall: 'live',
      overall_note:
        'Every figure in this document was fetched live from an authoritative public source at generation time.',
      rows: [
        { block: 'Zoning / PLUTO', source: 'NYC Open Data — MapPLUTO (64uk-42ks)', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Comparable sales', source: 'NYC Open Data — DOF Rolling Sales (usep-8jbt)', provenance: 'live', fetched_at: GENERATED_AT },
      ],
    },
    generatedAt: GENERATED_AT,
  };
}

// A deliberately heavy model: empty letterhead, long prose, and a 40-row table
// that MUST span a page break — this is the pagination shape that dropped the
// fixed footer under a page-level lineHeight. If the footer is ever dropped on a
// continuation page, this catches it.
export const STRESS_MODEL: RenderModel = {
  docTitle: 'Disclaimer Regression Stress Document',
  subtitle: 'Multi-page pagination + page-spanning table',
  letterhead: EMPTY_LETTERHEAD,
  sections: [
    {
      heading: 'Long Prose',
      paragraphs: [
        'This paragraph is intentionally long to consume vertical space and force pagination. '.repeat(12),
        'A second long paragraph continues to push content past the first page boundary so the fixed disclaimer footer must render on multiple pages. '.repeat(12),
      ],
    },
    {
      heading: 'Page-Spanning Table',
      provenanceNote: { provenance: 'representative', text: 'Synthetic rows: representative, for pagination testing only.' },
      table: {
        columns: ['Index', 'Address', 'Amount', 'Rate', 'Class'],
        rows: Array.from({ length: 40 }, (_, i) => [
          String(i + 1),
          `${1000 + i} Pagination Avenue`,
          `$${(500000 + i * 9876).toLocaleString('en-US')}`,
          `${(3 + (i % 5) * 0.25).toFixed(2)}%`,
          'R2',
        ]),
        caption: 'Forty synthetic rows guaranteeing a page break.',
      },
    },
    {
      heading: 'Closing Prose',
      paragraphs: ['A closing block of prose after the table to add another page. '.repeat(16)],
    },
  ],
  appendix: {
    overall: 'representative',
    overall_note:
      'This document contains representative figures (labeled below). It is not fully live.',
    rows: [
      {
        block: 'Pro forma benchmarks',
        source: 'KOANO representative benchmark',
        provenance: 'representative',
        fetched_at: GENERATED_AT,
        swap_note: 'Becomes live with a CoStar-tier data integration.',
      },
      { block: 'Zoning / PLUTO', source: 'NYC Open Data — MapPLUTO (64uk-42ks)', provenance: 'live', fetched_at: GENERATED_AT },
    ],
  },
  generatedAt: GENERATED_AT,
};

// A representative Development Site Screening Memo — exercises the verdict
// headline, identity band, FAR-contrast highlight, two-column tables, a visible
// trim note, and compact density.
function siteScreeningSample(): RenderModel {
  return {
    docTitle: 'Development Site Screening Memo',
    subtitle: '175 3rd Street, Brooklyn, NY',
    letterhead: EMPTY_LETTERHEAD,
    compact: true,
    sections: [
      { verdict: { decision: 'ADVANCE', tone: 'positive', confidence: 87, rationale: 'Material unused FAR and a 95% CD approval rate, with no disqualifying flags.' } },
      {
        heading: 'Site Identity',
        band: {
          items: [
            { label: 'Address', value: '175 3rd Street, Brooklyn' },
            { label: 'BBL', value: '3009720058' },
            { label: 'Borough', value: 'Brooklyn' },
            { label: 'Lot area', value: '120,793 sq ft' },
            { label: 'Zoning', value: 'M1-4/R7-2' },
            { label: 'Opportunity Zone', value: 'No' },
          ],
        },
      },
      {
        heading: 'As-of-Right Envelope',
        highlight: {
          figures: [
            { label: 'Base as-of-right max floor area', value: '415,528 sq ft', sub: 'residential FAR 3.44' },
            { label: 'City of Yes affordable-housing max', value: '605,173 sq ft', sub: 'FAR 5.01 · +189,645 sq ft with affordability', emphasis: true },
          ],
        },
        table: {
          columns: ['Envelope', 'Value'],
          rows: [
            ['Zoning district', 'M1-4/R7-2'],
            ['Unused development rights (base)', '402,010 sq ft'],
            ['Year built / building class', '1973 / K4'],
          ],
        },
        paragraphs: ['Envelope covers FAR and floor area only, under current PLUTO (26v1, City of Yes-updated). Not height- or parking-complete.'],
      },
      {
        heading: 'Entitlement Risk Read',
        table: {
          columns: ['Community district track record', 'Value'],
          rows: [
            ['CD approval ratio', '95%'],
            ['Disapproved filings', '2,731'],
            ['Median filing timeline', '573 days'],
          ],
        },
      },
      {
        heading: 'Assemblage & Air Rights',
        table: { columns: ['Block-level', 'Value'], rows: [['Registered owner', 'GOWANUS 3RD STREET OWNER LLC'], ['Block unused development rights', '0 sq ft']] },
        paragraphs: ['Block-level unused development rights are the assemblage read here.'],
      },
      {
        heading: 'Due Diligence Gap Register',
        table: {
          columns: ['Item', 'Status'],
          rows: [
            ['Zoning verification', 'Verified: NYC MapPLUTO (26v1)'],
            ['Title examination', 'Open: requires a title company'],
            ['Environmental assessment', 'Open: requires a Phase I/II'],
          ],
        },
      },
      {
        heading: 'Proof Points',
        table: { columns: ['Signal', 'Reading'], rows: [['Permit activity (24mo)', '312 permits'], ['FEMA flood', 'Zone X · outside SFHA']] },
        trimNote: 'Showing 4 of 5 proof points; ACS demographic direction was unavailable this run.',
      },
      {
        heading: 'Risk & Mitigant',
        table: { columns: ['Risk', 'Mitigant / note'], rows: [['No disqualifying public-record flags on the lot', 'Screening only. Open due-diligence items still apply.']] },
      },
      { heading: 'Reasoning', paragraphs: ['On the selection rule, this site is an ADVANCE at confidence 87. This is a screening read of public record, not a feasibility study.'] },
    ],
    appendix: {
      overall: 'live',
      overall_note: 'Every figure in this document was fetched live from an authoritative public source at generation time.',
      rows: [
        { block: 'Zoning / PLUTO', source: 'NYC Open Data — MapPLUTO (64uk-42ks)', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Entitlement track record', source: 'NYC Open Data — DOB Job Application Filings (ic3t-wcy2)', provenance: 'live', fetched_at: GENERATED_AT },
      ],
    },
    generatedAt: GENERATED_AT,
  };
}

// A representative Three-Site Comparison Brief. DELIBERATELY sized to span TWO
// pages so the disclaimer harness exercises the multi-site type's page-2 footer
// — the exact failure class it must catch. (A 1-page sample never tested it.)
function comparisonSample(): RenderModel {
  const rows: string[][] = [
    ['KOANO verdict', 'ADVANCE (78)', 'ADVANCE (72)', 'HOLD (52)'],
    ['Risk-adjusted rank', '#1', '#2', '#3'],
    ['Zoning district', 'M1-4/R7-2', 'R6', 'R6B'],
    ['Base max floor area', '415,528 sf', '242,250 sf', '7,500 sf'],
    ['City of Yes affordable max', '605,173 sf', '323,000 sf', '9,750 sf'],
    ['Unused development rights', '402,010 sf', '167,793 sf', '0 · built out'],
    ['CD approval ratio', '95%', '95%', '95%'],
    ['Median filing timeline', '567 d', '362 d', '531 d'],
    ['Opportunity Zone', 'No', 'No', 'No'],
    ['Adjacent block unused FAR', '0 sf', '144,498 sf', '110,791 sf'],
    ['Flood (SFHA)', 'X', 'X', 'AE · SFHA'],
    ['Open HPD violations', '0', '3', '1'],
    ['Speculation watch', 'No', 'No', 'No'],
    ['Permit activity (24mo)', '312', '96', '41'],
    ['Recorded sales $/sf', '$1,156', '$743', '$612'],
  ];
  return {
    docTitle: 'Three-Site Comparison Brief',
    subtitle: '175 3rd Street  ·  70-33 260th Street  ·  47-07 Vernon Blvd',
    letterhead: EMPTY_LETTERHEAD,
    compact: true,
    sections: [
      {
        heading: 'Site Comparison',
        table: {
          columns: ['Metric', '175 3rd Street', '70-33 260th St', '47-07 Vernon Blvd'],
          rows,
          caption: 'Identical structure across all sites. Every row is present for every site.',
        },
      },
      {
        // Deliberately long so this sample spans two pages — the harness then
        // verifies the disclaimer footer on the comparison type's SECOND page.
        heading: 'Reasoning',
        paragraphs: Array.from(
          { length: 10 },
          (_, i) =>
            `Reasoning paragraph ${i + 1}: applying the selection rule across the sites, 175 3rd Street leads on the magnitude of its development headroom and a favorable community-district entitlement record, weighed against a longer median filing timeline, while the remaining sites trade headroom against timeline and flood exposure. This is a screening comparison of public record, not a feasibility study, and carries no financial modelling.`,
        ),
      },
    ],
    appendix: {
      overall: 'live',
      overall_note: 'Every figure in this document was fetched live from an authoritative public source at generation time.',
      rows: [
        { block: 'Zoning / PLUTO', source: 'NYC Open Data — MapPLUTO (64uk-42ks)', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Entitlement track record', source: 'NYC Open Data — DOB Job Application Filings (ic3t-wcy2)', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Assemblage / air rights', source: 'NYC Open Data — MapPLUTO block-level ownership + unused FAR', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Comparable sales', source: 'NYC Open Data — DOF Rolling Sales (usep-8jbt)', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Flood zone', source: 'FEMA National Flood Hazard Layer', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Building permits', source: 'NYC Open Data — DOB permit issuance', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'House Price Index', source: 'FHFA HPI', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Opportunity Zone', source: 'IRS / CDFI Opportunity Zones', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Building violations', source: 'NYC Open Data — HPD / ECB / DOB', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Ownership / landlord portfolio', source: 'NYC Open Data — HPD registrations', provenance: 'live', fetched_at: GENERATED_AT },
      ],
    },
    generatedAt: GENERATED_AT,
  };
}

// Property Intelligence Report — identity band, value + context tables, and the
// synthesized trajectory narrative. All-live provenance.
function propertyIntelligenceSample(): RenderModel {
  return {
    docTitle: 'Property Intelligence Report',
    subtitle: '1318 Clay Avenue, Bronx, NY',
    letterhead: EMPTY_LETTERHEAD,
    sections: [
      {
        heading: 'What This Property Is',
        band: {
          items: [
            { label: 'Address', value: '1318 Clay Avenue, Bronx' },
            { label: 'BBL', value: '2028870196' },
            { label: 'Building class', value: 'C1' },
            { label: 'Year built', value: '1910' },
            { label: 'Residential units', value: '20' },
            { label: 'Opportunity Zone', value: 'Yes' },
          ],
        },
      },
      {
        heading: 'What It Is Worth (Indicative)',
        provenanceNote: { provenance: 'live', text: 'Indicative value = median recorded $/sq ft × PLUTO building area. Not an appraisal.' },
        table: {
          columns: ['Field', 'Value'],
          rows: [
            ['Indicative market value', '$2,850,000'],
            ['Median recorded sale $/sq ft', '$168'],
            ['Building area', '16,964 sq ft'],
            ['Recorded sales in scope', '31'],
            ['Local price trend', 'flat'],
          ],
          caption: 'Recorded sales; recorded sales have no days-on-market.',
        },
      },
      {
        heading: 'Where the Neighborhood Is Heading',
        table: {
          columns: ['Indicator', 'Reading'],
          rows: [
            ['Regional House Price Index (YoY)', '+4.2% — New York-Newark-Jersey City'],
            ['Area permits (last 24 months)', '126'],
            ['Median household income (tract)', '$41,300'],
          ],
          caption: 'Demographics: ACS 5-year 2023.',
        },
      },
      {
        heading: 'Public Record: What to Watch',
        table: {
          columns: ['Field', 'Value'],
          rows: [
            ['Open HPD violations', '40'],
            ['HPD-registered (3+ units)', 'Yes'],
            ['FEMA flood zone', 'X'],
          ],
          caption: 'For the complete, citable detail, see the Violation & Ownership Record.',
        },
      },
      {
        heading: 'Neighborhood Trajectory',
        paragraphs: [
          'The indicative value and a flat local price trend sit against a regional index still rising modestly year over year, so the property reads as steady rather than accelerating. '.repeat(2),
          'That steadiness is qualified by an open-violation load a buyer would need to reconcile against the price story, while the flood read is benign. '.repeat(2),
        ],
      },
    ],
    appendix: {
      overall: 'live',
      overall_note: 'Every figure in this document was fetched live from an authoritative public source at generation time.',
      rows: [
        { block: 'Zoning / PLUTO', source: 'NYC Open Data — MapPLUTO (64uk-42ks)', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Comparable sales', source: 'NYC Open Data — DOF Rolling Sales (usep-8jbt)', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Building violations', source: 'NYC Open Data — HPD / ECB / DOB', provenance: 'live', fetched_at: GENERATED_AT },
      ],
    },
    generatedAt: GENERATED_AT,
  };
}

// Violation & Ownership Record — DELIBERATELY sized with a long full-record
// table so the sample spans multiple pages, exercising the dense evidentiary
// type's continuation-page footer (its whole point is completeness at length).
function violationRecordSample(): RenderModel {
  const record = Array.from({ length: 60 }, (_, i) => [
    `2026-0${(i % 9) + 1}-${String((i % 27) + 1).padStart(2, '0')}`,
    (['HPD', 'ECB', 'DOB'] as const)[i % 3],
    `VID-${100000 + i}`,
    i % 4 === 0 ? 'Open' : 'Closed',
    `Class ${['A', 'B', 'C'][i % 3]} — § 27-20${(i % 90) + 10} sample violation description text ${i}`,
  ]);
  return {
    docTitle: 'Violation & Ownership Record',
    subtitle: '1318 Clay Avenue, Bronx, NY',
    letterhead: EMPTY_LETTERHEAD,
    compact: true,
    sections: [
      {
        heading: 'Building Identity',
        band: {
          items: [
            { label: 'Address', value: '1318 Clay Avenue, Bronx' },
            { label: 'BBL', value: '2028870196' },
            { label: 'BIN', value: '2009314' },
            { label: 'Residential units', value: '20' },
          ],
        },
      },
      {
        heading: 'Coverage & How to Read This Record',
        provenanceNote: { provenance: 'live', text: 'HPD, ECB, and DOB records pulled live from NYC Open Data.' },
        paragraphs: [
          'This building is registered with HPD as a multiple dwelling (3 or more residential units), so HPD Housing Maintenance Code violations are within coverage.',
          'Scope: HPD boroid/block/lot + ECB/DOB by BIN.',
        ],
      },
      {
        heading: 'Registered Ownership',
        table: {
          columns: ['Field', 'Value'],
          rows: [
            ['Registered owner', 'CLAY AVENUE HOLDINGS LLC'],
            ['Owner type', 'CorporateOwner'],
            ['Managing agent', 'SAMPLE MGMT CO'],
            ['On NYC speculation watch list', 'No'],
          ],
          caption: 'Source: NYC HPD Multiple Dwelling Registrations. Exact-entity match.',
        },
      },
      {
        heading: 'Violation Summary',
        table: {
          columns: ['Agency', 'Open / Active', 'Total', 'Detail'],
          rows: [
            ['HPD (Housing Maintenance Code)', '40', '75', 'Class A: 12, Class B: 20, Class C: 8'],
            ['ECB (Environmental Control Board)', '1', '1', 'most recent 2024-06-01'],
            ['DOB complaints', '0', '2', 'most recent 2019-03-01'],
          ],
          caption: 'Open/Active are currently-unresolved; Total includes closed history.',
        },
      },
      {
        heading: 'Full Violation Record',
        table: {
          columns: ['Date', 'Agency', 'Violation ID', 'Status', 'Description'],
          rows: record,
          caption: 'Every recorded HPD, ECB, and DOB violation for this building, newest first (60 records). Each row is citable by its violation ID.',
        },
      },
    ],
    appendix: {
      overall: 'live',
      overall_note: 'Every figure in this document was fetched live from an authoritative public source at generation time.',
      rows: [
        { block: 'Building violations', source: 'NYC Open Data — HPD / ECB / DOB', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Ownership / landlord portfolio', source: 'NYC Open Data — HPD registrations', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Zoning / PLUTO', source: 'NYC Open Data — MapPLUTO (64uk-42ks)', provenance: 'live', fetched_at: GENERATED_AT },
      ],
    },
    generatedAt: GENERATED_AT,
  };
}

// Permit History Report — chronological subject history with EXPIRED flags and
// the neighborhood-activity context section.
function permitHistorySample(): RenderModel {
  return {
    docTitle: 'Permit History Report',
    subtitle: '1318 Clay Avenue, Bronx, NY',
    letterhead: EMPTY_LETTERHEAD,
    compact: true,
    sections: [
      {
        heading: 'Building Identity',
        band: {
          items: [
            { label: 'Address', value: '1318 Clay Avenue, Bronx' },
            { label: 'BBL', value: '2028870196' },
            { label: 'BIN', value: '2009314' },
            { label: 'Year built', value: '1910' },
          ],
        },
      },
      {
        heading: 'Subject Building Permit History',
        provenanceNote: { provenance: 'live', text: 'Queried live from NYC DOB records at generation time.' },
        table: {
          columns: ['Issued', 'Job / work type', 'Status', 'Expires', 'Source'],
          rows: [
            ['2018-03-16', 'A2 / PL', 'EXPIRED', '2019-03-16', 'DOB legacy'],
            ['2017-09-29', 'A2 / OT', 'EXPIRED', '2018-03-27', 'DOB legacy'],
          ],
          caption: 'All DOB permits on record for this building, newest first (2 permits).',
        },
      },
      {
        heading: 'Open & Expired Permits: Why It Matters',
        paragraphs: [
          'This building has 0 open (active) permits and 2 expired permits on record.',
          'An EXPIRED permit means DOB-authorized work was not signed off before the permit lapsed; a title company or expeditor should reconcile these against the actual condition of the building.',
          'History merges DOB NOW and legacy DOB Permit Issuance; a short history is a record of what was filed, not proof no other work occurred.',
        ],
      },
      {
        heading: 'Neighborhood Permit Activity (last 24 months)',
        table: {
          columns: ['Metric', 'Count'],
          rows: [
            ['Total permits issued in the area', '126'],
            ['New-building permits', '3'],
            ['Demolition permits', '1'],
            ['Alteration / construction permits', '88'],
          ],
          caption: 'Area context, not this building: census tract 017702, Bronx.',
        },
      },
    ],
    appendix: {
      overall: 'live',
      overall_note: 'Every figure in this document was fetched live from an authoritative public source at generation time.',
      rows: [
        { block: 'Building permits', source: 'NYC Open Data — DOB NOW (rbx6-tga4) + legacy DOB Permit Issuance (ipu4-2q9a)', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Zoning / PLUTO', source: 'NYC Open Data — MapPLUTO (64uk-42ks)', provenance: 'live', fetched_at: GENERATED_AT },
      ],
    },
    generatedAt: GENERATED_AT,
  };
}

// Investment Committee Memo — the long-form type. Exercises the title page,
// the two-pass audited TOC, numbered sections, a placeholder, the exhibits with
// a page-spanning comps table, AND the staleness banner (verdict > 30 days old).
// Deliberately long so it spans many pages, testing the disclaimer + page-number
// footer on every page including continuation pages.
function icMemoSample(): RenderModel {
  const comps = Array.from({ length: 40 }, (_, i) => [
    `${100 + i} Example Street`,
    `2025-0${(i % 9) + 1}-15`,
    `$${(850000 + i * 15000).toLocaleString('en-US')}`,
    `$${(600 + i * 7).toLocaleString('en-US')}`,
    `${(1200 + i * 40).toLocaleString('en-US')}`,
    'C0',
  ]);
  const placeholders: RenderSection[] = [
    { number: '6', heading: 'Financial Analysis, Returns & Sensitivity', placeholder: { note: 'Underwriting model, yields, IRR/equity multiple, and a sensitivity table. KOANO does not source deal financials.' } },
    { number: '7', heading: 'Business Plan', placeholder: { note: 'Acquisition basis, capital plan, lease-up/reposition strategy, operating assumptions.' } },
    { number: '8', heading: 'Exit Strategy', placeholder: { note: 'Hold period, exit route, target exit pricing, buyer universe.' } },
    { number: '9', heading: 'Key Terms', placeholder: { note: 'Structure, price, financing, closing conditions, contingencies.' } },
  ];
  return {
    docTitle: 'Investment Committee Memo',
    subtitle: '175 3rd Street, Brooklyn, NY',
    letterhead: NAMED_LETTERHEAD,
    longForm: true,
    titleBanner: { decision: 'BUY', tone: 'positive', confidence: 74 },
    verdictGeneratedAt: '2025-11-20T00:00:00.000Z', // > 30 days before GENERATED_AT → staleness banner
    stalenessBanner:
      'STALENESS NOTICE: the underlying KOANO verdict is 42 days old. The market data in this memo was fetched at generation time, but the verdict reflects conditions as of the verdict date. Re-run the analysis before relying on the recommendation.',
    sections: [
      {
        number: '1',
        heading: 'Executive Summary & Recommendation',
        pageBreakBefore: true,
        provenanceNote: { provenance: 'live', text: 'Built from a stored KOANO verdict generated 2025-11-20 (42 days before this memo). Verdict provenance: live.' },
        paragraphs: [
          "KOANO's recommendation for 175 3rd Street is to advance to underwriting. The engine returns a BUY verdict at confidence 74/100, with a confidence-weighted panel score of 1.12 against thresholds. ".repeat(2),
          'This memo is decision-support built on public record. KOANO cannot source deal financials; those sections are scaffolded for the analyst. '.repeat(2),
        ],
      },
      {
        number: '2',
        heading: 'Property Description',
        table: {
          columns: ['Field', 'Value'],
          rows: [
            ['Address', '175 3rd Street, Brooklyn'],
            ['BBL', '3009720058'],
            ['Zoning district', 'M1-4/R7-2'],
            ['Building class / land use', 'K4 / 05'],
            ['Lot area / building area', '120,793 sq ft / 13,518 sq ft'],
            ['Year built / residential units', '1931 / 0'],
            ['Assessed total / land (DOF)', '$4,185,900 / $3,261,600'],
          ],
          caption: 'Source: NYC DOF assessment roll via MapPLUTO (live).',
        },
      },
      {
        number: '3',
        heading: 'Market & Submarket Analysis',
        table: {
          columns: ['Indicator', 'Reading'],
          rows: [
            ['House Price Index: YoY', '+5.6% (New York-Jersey City-White Plains)'],
            ['Recorded sale $/sq ft (median)', '$1,156'],
            ['Neighborhood permits (24 months)', '312'],
            ['Opportunity Zone', 'No'],
          ],
        },
      },
      {
        number: '4',
        heading: 'Risk Factors & Mitigants',
        table: {
          columns: ['Risk factor', 'Mitigant / note'],
          rows: [
            ['Building violations — HPD 0 open of 3', 'Quantify remediation cost in diligence.'],
            ['Flood — FEMA zone X', 'Outside SFHA. Limited flood exposure.'],
          ],
          caption: 'Public-record risk read; not a substitute for third-party diligence.',
        },
      },
      {
        number: '5',
        heading: 'Comparable Sales',
        provenanceNote: { provenance: 'live', text: 'RESIDENTIAL recorded sales from NYC DOF Rolling Sales. NOT institutional CRE transactions.' },
        paragraphs: ['144 qualifying residential recorded sales are in scope, at a median of $1,156/sq ft. The full comparable set is in Exhibit A.'],
      },
      ...placeholders,
      {
        number: 'A',
        heading: 'Exhibit A: Comparable Recorded Sales (Full Set)',
        pageBreakBefore: true,
        provenanceNote: { provenance: 'live', text: 'Residential recorded sales (NYC DOF Rolling Sales). Not institutional CRE comps.' },
        table: {
          columns: ['Address', 'Sale date', 'Sale price', '$/sq ft', 'Sq ft', 'Class'],
          rows: comps,
          caption: '144 sales in scope.',
        },
      },
      {
        number: 'B',
        heading: 'Exhibit B: Verdict Math',
        paragraphs: ["KOANO's verdict is a confidence-weighted vote across five specialist agents (method: confidence-weighted v1)."],
        table: {
          columns: ['Agent', 'Verdict', 'Confidence (weight)', 'Direction', 'Contribution'],
          rows: [
            ['market-timing', 'hold', '72', '0', '+0'],
            ['infrastructure', 'buy', '86', '2', '+172'],
            ['demand-sentiment', 'buy', '72', '2', '+144'],
            ['risk-volatility', 'hold', '72', '0', '+0'],
            ['regulatory-policy', 'buy', '86', '2', '+172'],
            ['— Weighted score —', '', '388', '', '1.26'],
          ],
          caption: 'Weighted score 1.26 vs thresholds: buy ≥ 1, hold ≥ -0.3, wait ≥ -1.2 → BUY at confidence 74/100.',
        },
      },
    ],
    appendix: {
      overall: 'live',
      overall_note: 'Every figure in this document was fetched live from an authoritative public source at generation time.',
      rows: [
        { block: 'Zoning / PLUTO', source: 'NYC Open Data — MapPLUTO (64uk-42ks)', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Comparable sales', source: 'NYC Open Data — DOF Rolling Sales (usep-8jbt)', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'House Price Index', source: 'FHFA HPI', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Building violations', source: 'NYC Open Data — HPD / ECB / DOB', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Flood zone', source: 'FEMA National Flood Hazard Layer', provenance: 'live', fetched_at: GENERATED_AT },
      ],
    },
    generatedAt: GENERATED_AT,
  };
}

// Asset One-Pager — compact, single page, condensed (compactProvenance)
// appendix. Exercises the verdict headline, identity band, and the inline
// provenance list that keeps the mandatory appendix on one page.
function assetOnePagerSample(): RenderModel {
  return {
    docTitle: 'Asset One-Pager',
    subtitle: '175 3rd Street, Brooklyn, NY',
    letterhead: EMPTY_LETTERHEAD,
    compact: true,
    compactProvenance: true,
    sections: [
      { verdict: { decision: 'HOLD', tone: 'warning', confidence: 67, rationale: 'Balanced signals: price momentum against unresolved regulatory context.' } },
      {
        heading: 'Property & Envelope',
        band: {
          items: [
            { label: 'Address', value: '175 3rd Street, Brooklyn' },
            { label: 'BBL', value: '3009720058' },
            { label: 'Class / year', value: 'K4 / 1931' },
            { label: 'Zoning', value: 'M1-4/R7-2' },
            { label: 'Lot / building area', value: '120,793 / 13,518 sq ft' },
            { label: 'Opportunity Zone', value: 'No' },
          ],
        },
      },
      {
        heading: 'Key Market Indicators',
        table: {
          columns: ['Indicator', 'Reading'],
          rows: [
            ['House Price Index (YoY / 5-yr)', '+5.6% / +45.0% — New York-Jersey City'],
            ['Recorded sale $/sq ft (median)', '$1,156'],
            ['Recorded sales in scope / trend', '141 / rising'],
          ],
          caption: 'Recorded residential sales (NYC DOF), not institutional CRE transactions.',
        },
      },
      {
        heading: 'Top Risks',
        table: {
          columns: ['Risk', 'Reading'],
          rows: [
            ['KOANO risk score', '50 / 100'],
            ['FEMA flood zone', 'X (outside SFHA)'],
            ['Open violations (HPD / ECB / DOB)', '0 / 0 / 0'],
          ],
        },
      },
      {
        heading: 'Current Status',
        paragraphs: ['KOANO verdict HOLD at confidence 67/100, generated 2026-01-01 (0 days ago). Decision support built on public record, not a decision.'],
      },
    ],
    appendix: {
      overall: 'live',
      overall_note: 'Every rendered figure AND the underlying KOANO verdict were derived from live, authoritative public data at generation time.',
      rows: [
        { block: 'Zoning / PLUTO', source: 'NYC Open Data — MapPLUTO (64uk-42ks)', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Comparable sales', source: 'NYC Open Data — DOF Rolling Sales (usep-8jbt)', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'House Price Index', source: 'FHFA HPI', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Flood zone', source: 'FEMA NFHL', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Building violations', source: 'NYC Open Data — HPD / ECB / DOB', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'KOANO verdict', source: 'KOANO synthesis engine (confidence-weighted v1)', provenance: 'live', fetched_at: GENERATED_AT },
      ],
    },
    generatedAt: GENERATED_AT,
  };
}

// Monday Portfolio Briefing PDF — the four parsed sections + condensed appendix.
function mondayBriefingSample(): RenderModel {
  return {
    docTitle: 'Monday Portfolio Briefing',
    subtitle: 'Portfolio of 2 properties',
    letterhead: EMPTY_LETTERHEAD,
    compactProvenance: true,
    sections: [
      { heading: 'Portfolio Summary', paragraphs: ['The portfolio of two tracked properties carries one HOLD and one BUY verdict as of the latest analyses. '.repeat(2)] },
      { heading: 'Property Notes', paragraphs: ['175 3rd Street, Brooklyn: HOLD at confidence 67; 312 permits in the surrounding tract over 24 months; flood zone X.', '47-07 Vernon Blvd, Queens: BUY at confidence 74; active permit environment; worth reviewing the latest recorded sales.'] },
      { heading: 'Risk Watch', paragraphs: ['No properties sit inside a Special Flood Hazard Area on current FEMA maps. Worth reviewing where verdict confidence was low.'] },
      { heading: 'The Week Ahead', paragraphs: ['Re-run analysis on any property whose verdict predates the last month. Flag the Vernon Blvd flood designation for diligence.'] },
    ],
    appendix: {
      overall: 'live',
      overall_note: 'Every input to this briefing was fetched live from an authoritative public source at generation time.',
      rows: [
        { block: 'KOANO verdict audit trail', source: 'KOANO verdict audit trail', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'NYC DOB permits', source: 'NYC Open Data — DOB permits', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'FEMA flood', source: 'FEMA National Flood Hazard Layer', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'FHFA HPI', source: 'FHFA House Price Index', provenance: 'live', fetched_at: GENERATED_AT },
      ],
    },
    generatedAt: GENERATED_AT,
  };
}

const LIVE_APPENDIX = {
  overall: 'live' as const,
  overall_note: 'Every figure in this document was fetched live from an authoritative public source at generation time.',
  rows: [
    { block: 'Zoning / PLUTO', source: 'NYC Open Data — MapPLUTO (64uk-42ks)', provenance: 'live' as const, fetched_at: GENERATED_AT },
    { block: 'Comparable sales', source: 'NYC Open Data — DOF Rolling Sales (usep-8jbt)', provenance: 'live' as const, fetched_at: GENERATED_AT },
    { block: 'House Price Index', source: 'FHFA HPI', provenance: 'live' as const, fetched_at: GENERATED_AT },
  ],
};

function pricingSheetSample(): RenderModel {
  return {
    docTitle: 'Pricing Recommendation Sheet',
    subtitle: '369 6th Street, Brooklyn, NY',
    letterhead: NAMED_LETTERHEAD,
    sections: [
      {
        heading: 'Recommended Price Band',
        provenanceNote: { provenance: 'live', text: 'The band is the interquartile spread (25th–75th percentile) of comparable recorded $/sq ft. Not an appraisal or a list price.' },
        highlight: {
          figures: [
            { label: 'Low (25th percentile)', value: '$3,200,000', sub: '$1,010/sq ft' },
            { label: 'Midpoint (median)', value: '$3,660,000', sub: '$1,156/sq ft', emphasis: true },
            { label: 'High (75th percentile)', value: '$4,120,000', sub: '$1,301/sq ft' },
          ],
        },
        paragraphs: ['Derivation: 141 qualifying recorded sales reduced to $/sq ft; the 25th/50th/75th percentiles applied to 3,166 sq ft of building area. The interquartile spread excludes outliers on both ends.'],
      },
      {
        heading: 'How These Comparables Were Selected',
        paragraphs: ['To keep the selection defensible rather than cherry-picked, KOANO applies a fixed rule to NYC DOF recorded sales:', '• Residential recorded sales only (DOF classes 01, 02, 03, 09, 10, 12, 13).', '• A trailing window keyed to the subject ZIP.', '• Sales with a recorded gross square footage.', '• A trimmed median for the central figure.'],
      },
      {
        heading: 'Comparable Recorded Sales',
        table: { columns: ['Address', 'Sale date', 'Sale price', '$/sq ft', 'Sq ft', 'Class'], rows: Array.from({ length: 6 }, (_, i) => [`${100 + i} Example St`, `2026-0${i + 1}-10`, `$${(3_000_000 + i * 120000).toLocaleString('en-US')}`, `$${1000 + i * 60}`, `${2800 + i * 100}`, '01'], ), caption: '141 qualifying recorded sales in scope.' },
      },
    ],
    appendix: LIVE_APPENDIX,
    generatedAt: GENERATED_AT,
  };
}

function cmaSample(): RenderModel {
  return {
    docTitle: 'Comparative Market Analysis',
    subtitle: '369 6th Street, Brooklyn, NY',
    letterhead: NAMED_LETTERHEAD,
    sections: [
      {
        heading: 'Pricing Recommendation',
        provenanceNote: { provenance: 'live', text: 'An indicative range from distance-ranked recorded sales, not an appraisal. Midpoint also shown adjusted to today via the regional House Price Index.' },
        highlight: {
          figures: [
            { label: 'Low (25th percentile)', value: '$3,200,000', sub: '$1,010/sq ft' },
            { label: 'Midpoint (trimmed median)', value: '$3,660,000', sub: '$1,156/sq ft', emphasis: true },
            { label: 'HPI-adjusted midpoint', value: '$3,780,000', sub: '$1,194/sq ft' },
          ],
        },
        paragraphs: ['The band is the interquartile spread of 107 comparable recorded $/sq ft, ranked by true distance from the subject, applied to 3,166 sq ft. The HPI-adjusted midpoint moves each comp to today via the New York MSA index (+3.1% YoY). Local recorded-sale prices are rising.'],
      },
      {
        heading: 'Comparable Sales',
        table: {
          columns: ['Address', 'Dist.', 'Sale date', 'Sale price', '$/sq ft', 'Adj. $/sq ft', 'Sq ft', 'Class'],
          rows: Array.from({ length: 6 }, (_, i) => [`${100 + i} Example St`, `0.${2 + i} mi`, `2026-0${i + 1}-10`, `$${(3_000_000 + i * 120000).toLocaleString('en-US')}`, `$${1000 + i * 60}`, `$${1030 + i * 60}`, `${2800 + i * 100}`, '01']),
          caption: '107 qualifying recorded sales, distance-ranked. Recorded sales carry no beds/baths, condition, or days-on-market (those require MLS).',
        },
      },
      { heading: 'Market Narrative', paragraphs: ['The comparable recorded sales place value in a band of $1,010 to $1,301 per square foot, central figure $1,156. Local prices are rising and the New York MSA index moved +3.1% year over year. On financing, 22% of county mortgage applications were denied. This is an indicative range from recorded sales, not an appraisal.'] },
    ],
    appendix: LIVE_APPENDIX,
    generatedAt: GENERATED_AT,
  };
}

function portfolioRiskSample(): RenderModel {
  return {
    docTitle: 'Portfolio Risk Report',
    subtitle: 'Portfolio (3 properties)',
    letterhead: NAMED_LETTERHEAD,
    sections: [
      {
        heading: 'Risk Exposure',
        provenanceNote: { provenance: 'live', text: 'Live federal + city hazard data per property. Decision-support, not decision-making.' },
        highlight: {
          figures: [
            { label: 'Properties assessed', value: '3 of 3', emphasis: true },
            { label: 'In a Special Flood Hazard Area', value: '1' },
            { label: 'With a Superfund site ≤2 mi', value: '2' },
            { label: 'With a disaster declared (10 yr)', value: '3' },
          ],
        },
        paragraphs: ['1 of 3 assessed properties sit in a FEMA Special Flood Hazard Area; 2 have an EPA Superfund site within two miles; 3 are in a county with a federally-declared disaster in the last ten years.'],
      },
      {
        heading: 'Per-Property Risk',
        table: {
          columns: ['Property', 'FEMA flood', 'Superfund ≤2mi', 'Seismic PGA (g)', 'Disasters (10yr)', 'Crime trend'],
          rows: [
            ['175 3rd St, Brooklyn', 'AE · SFHA', '12 (nearest 0.24mi)', '0.17', '6', 'falling'],
            ['47-07 Vernon Blvd, LIC', 'X', '2 (nearest 0.4mi)', '0.16', '6', 'flat'],
            ['369 6th St, Brooklyn', 'X', '0', '0.17', '6', 'falling'],
          ],
          caption: 'Flood zone is the current regulatory reality; disaster history is complementary. Contamination is a 2-mile proximity count.',
        },
      },
    ],
    appendix: LIVE_APPENDIX,
    generatedAt: GENERATED_AT,
  };
}

function netSheetSample(): RenderModel {
  return {
    docTitle: 'Buyer / Seller Net Sheet',
    subtitle: '369 6th Street, Brooklyn, NY',
    letterhead: NAMED_LETTERHEAD,
    sections: [
      {
        heading: 'Assumed Sale Price',
        provenanceNote: { provenance: 'live', text: 'THIS IS A KOANO-DERIVED INDICATIVE VALUE from recorded comparable sales. NOT an appraisal, a listing price, or an accepted offer.' },
        highlight: { figures: [{ label: 'KOANO indicative value (recorded sales)', value: '$3,660,000', sub: '$1,156/sq ft median × 3,166 sq ft · 141 recorded sales', emphasis: true }] },
        paragraphs: ['Every line below is estimated FROM this figure. If you have a contract or list price, use that instead.'],
      },
      {
        heading: 'Closing Costs: You Provide These',
        provenanceNote: { provenance: 'representative', text: 'KOANO does not know these figures. Fill them in from your closing statement, lender, and attorney.' },
        table: { columns: ['Line item', 'Amount', 'Why KOANO cannot source it'], rows: [['Transfer taxes (NYC RPTT + NY State)', '_____________', 'Rate depends on price band and party.'], ['Title insurance & search', '_____________', 'Set by the title company.'], ['Broker commission', '_____________', 'Negotiated per engagement.'], ['Mortgage payoff (seller)', '_____________', 'From your lender.']], caption: 'These are inputs, not KOANO outputs.' },
      },
      { heading: 'Estimated Net', paragraphs: ['Seller net proceeds = sale price − (transfer taxes + title + commission + mortgage payoff + attorney/misc.)', 'KOANO does not compute a net total, because the inputs are yours to supply.'] },
    ],
    appendix: { ...LIVE_APPENDIX, rows: LIVE_APPENDIX.rows.slice(0, 2) },
    generatedAt: GENERATED_AT,
  };
}

function neighborhoodSample(): RenderModel {
  return {
    docTitle: 'Client Neighborhood Report',
    subtitle: '369 6th Street, Brooklyn, NY',
    letterhead: NAMED_LETTERHEAD,
    sections: [
      {
        heading: 'Neighborhood Snapshot',
        provenanceNote: { provenance: 'live', text: 'Recorded residential sales (NYC DOF), FHFA price index, NYC DOB permits, FEMA flood. All live. Not an appraisal.' },
        table: { columns: ['Indicator', 'Reading'], rows: [['Recorded home sales: median $/sq ft', '$1,156'], ['Recorded sales in scope / recent trend', '141 / rising'], ['Price index: past year / 5 years', '+5.6% / +45.0% — New York-Jersey City'], ['Building permits nearby (last 24 months)', '312'], ['FEMA flood zone', 'X']] },
      },
      { heading: 'Neighborhood Narrative', paragraphs: ['On price: recorded homes here have sold at a median of $1,156 per square foot across 141 recent sales; recent prices are rising. '.repeat(2), 'On flood risk: the property is in FEMA flood zone X, outside the higher-risk Special Flood Hazard Area.'] },
    ],
    appendix: LIVE_APPENDIX,
    generatedAt: GENERATED_AT,
  };
}

function entitlementMemoSample(): RenderModel {
  return {
    docTitle: 'Entitlement Risk Memo',
    subtitle: '175 3rd Street, Brooklyn, NY',
    letterhead: EMPTY_LETTERHEAD,
    sections: [
      { heading: 'Zoning & Entitlement Context', band: { items: [{ label: 'Address', value: '175 3rd Street, Brooklyn' }, { label: 'Community district', value: '306' }, { label: 'Zoning district', value: 'M1-4/R7-2' }, { label: 'Unused FAR (headroom)', value: '97%' }, { label: 'Opportunity Zone', value: 'No' }] } },
      {
        heading: 'Community District Track Record',
        provenanceNote: { provenance: 'live', text: 'A DISPOSITION TRACK RECORD from DOB Job Application Filings, not a prediction of any specific project.' },
        table: { columns: ['Measure', 'Value'], rows: [['Approval ratio (approved / decided)', '95%'], ['Approved', '2,981'], ['Disapproved', '148'], ['Withdrawn', '211'], ['Suspended', '64'], ['In process', '512'], ['Total filings in scope', '3,916'], ['Median filing timeline', '573 days']] },
      },
      { heading: 'Subject-Lot Filing History', table: { columns: ['Job', 'Type', 'Status', 'Latest action'], rows: [['302345678', 'NB', 'PERMIT ISSUED', '03/04/2026'], ['302233445', 'DM', 'SIGNED OFF', '07/03/2025']], caption: '2 filing(s) on record for this lot.' } },
      { heading: 'Risk Assessment', paragraphs: ['Community district 306 shows a 95% approval ratio across 3,916 DOB job filings. These are base-rate context, a disposition track record, not a prediction. '.repeat(2)] },
    ],
    appendix: LIVE_APPENDIX,
    generatedAt: GENERATED_AT,
  };
}

// One representative model per implemented document type.
export const SAMPLE_MODELS: Record<string, RenderModel> = {
  tax_appeal_packet: taxAppealSample(),
  property_intelligence_report: propertyIntelligenceSample(),
  violation_ownership_record: violationRecordSample(),
  permit_history_report: permitHistorySample(),
  site_screening_memo: siteScreeningSample(),
  three_site_comparison_brief: comparisonSample(),
  ic_memo: icMemoSample(),
  monday_briefing_pdf: mondayBriefingSample(),
  asset_one_pager: assetOnePagerSample(),
  pricing_recommendation_sheet: pricingSheetSample(),
  buyer_seller_net_sheet: netSheetSample(),
  client_neighborhood_report: neighborhoodSample(),
  entitlement_risk_memo: entitlementMemoSample(),
  cma: cmaSample(),
  portfolio_risk_report: portfolioRiskSample(),
};
