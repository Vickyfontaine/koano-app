// A REAL recorded KOANO verdict, used to render the actual VerdictMathPanel on
// the marketing site so a visitor sees the product's genuine arithmetic, not a
// mockup. Every figure here is verbatim from the verdict-reproducibility fixture
// (scripts/fixtures/nyc-175-3rd-st.json), recorded 2026-08-26 for 175 3rd Street,
// Brooklyn. Nothing is invented. It is a frozen real run, shown as a dated
// example. The reproducibility gate asserts this exact decision surface on every
// push, so what the site shows and what the engine produces cannot drift apart.

import type {
  AgentSummary,
  LedgerDataPoint,
  Provenance,
  Verdict,
  WeightingBreakdown,
} from "@/components/ui/verdict";

export const EXAMPLE_VERDICT_ADDRESS = "175 3rd Street, Brooklyn";
export const EXAMPLE_VERDICT_DATE = "August 26, 2026";

const breakdown: WeightingBreakdown = {
  method: "confidence-weighted v1",
  inputs_era: "v2-federal-risk-supply",
  aggregate_score: 0.23,
  final_score: 1.23,
  structural_nudge: 1,
  structural_drivers: [
    "97% unused FAR — large as-of-right development upside → buy",
  ],
  chosen_verdict: "buy",
  thresholds: { buy: 1, hold: -0.3, wait: -1.2 },
  total_weight: 391,
  agents: [
    { agent: "demand-sentiment", verdict: "hold", confidence: 74, direction: 0, weight: 74, contribution: 0 },
    { agent: "infrastructure", verdict: "buy", confidence: 82, direction: 2, weight: 82, contribution: 164 },
    { agent: "market-timing", verdict: "hold", confidence: 80, direction: 0, weight: 80, contribution: 0 },
    { agent: "regulatory-policy", verdict: "wait", confidence: 75, direction: -1, weight: 75, contribution: -75 },
    { agent: "risk-volatility", verdict: "hold", confidence: 80, direction: 0, weight: 80, contribution: 0 },
  ],
};

// headline is required by the type but is not rendered by VerdictMathPanel (it
// reads only overall_provenance here); left empty rather than inventing agent
// prose that was not part of the recorded run.
const agentSummaries: AgentSummary[] = [
  { agent: "demand-sentiment", verdict: "hold", confidence: 74, risk_score: 50, overall_provenance: "live", headline: "" },
  { agent: "infrastructure", verdict: "buy", confidence: 82, risk_score: 50, overall_provenance: "live", headline: "" },
  { agent: "market-timing", verdict: "hold", confidence: 80, risk_score: 50, overall_provenance: "live", headline: "" },
  { agent: "regulatory-policy", verdict: "wait", confidence: 75, risk_score: 63, overall_provenance: "live", headline: "" },
  { agent: "risk-volatility", verdict: "hold", confidence: 80, risk_score: 50, overall_provenance: "live", headline: "" },
];

export const EXAMPLE_VERDICT = {
  verdict: "buy" as Verdict,
  confidence: 69,
  risk_score: 51,
  signal_window_months: 12,
  overall_provenance: "live" as Provenance,
  agent_summaries: agentSummaries,
  weighting_breakdown: breakdown,
};

// The per-figure ledger from the SAME recorded run. Every value and source here
// is transcribed verbatim from the fixture's live provider results — a real NYC
// verdict rolls up fully live, so every figure below is live and sourced. This is
// what "every figure carries its source" looks like on a real address.
export const EXAMPLE_LEDGER: LedgerDataPoint[] = [
  // Market timing
  { agent: "market-timing", label: "Median comp price", value: "$1,154 / sq ft", provenance: "live", source: "NYC DOF Rolling Sales (usep-8jbt)" },
  { agent: "market-timing", label: "Home price index, year over year", value: "+5.6%", provenance: "live", source: "FHFA House Price Index (2026 Q1)" },
  { agent: "market-timing", label: "30-year mortgage rate", value: "6.65%", provenance: "live", source: "Freddie Mac PMMS" },
  { agent: "market-timing", label: "Fair market rent, 2-bedroom", value: "$2,910 / mo", provenance: "live", source: "HUD Fair Market Rents (FY2026)" },
  // Infrastructure
  { agent: "infrastructure", label: "DOB permits in tract (24 mo)", value: 675, provenance: "live", source: "NYC DOB permits (DOB NOW + legacy)" },
  { agent: "infrastructure", label: "New-building permits on lot", value: 0, provenance: "live", source: "NYC DOB permits (DOB NOW + legacy)" },
  // Demand sentiment
  { agent: "demand-sentiment", label: "Median household income", value: "$165,179", provenance: "live", source: "US Census ACS 2024 5-year" },
  { agent: "demand-sentiment", label: "Mortgage denial rate (county)", value: "31.9%", provenance: "live", source: "CFPB HMDA (2024)" },
  { agent: "demand-sentiment", label: "Net county migration", value: "−11,517 returns", provenance: "live", source: "IRS SOI migration (2021–2022)" },
  // Risk & volatility
  { agent: "risk-volatility", label: "FEMA flood zone", value: "X (minimal hazard)", provenance: "live", source: "FEMA National Flood Hazard Layer" },
  { agent: "risk-volatility", label: "FEMA National Risk Index", value: "Very Low (9)", provenance: "live", source: "FEMA National Risk Index" },
  { agent: "risk-volatility", label: "EPA cleanup sites within 2 mi", value: "16 (nearest 0.24 mi)", provenance: "live", source: "EPA Facility Registry Service" },
  { agent: "risk-volatility", label: "Reported crime, 1-mile radius (YTD)", value: "5,254 incidents (flat)", provenance: "live", source: "NYPD Complaint Data (5uac-w243)" },
  // Regulatory & policy
  { agent: "regulatory-policy", label: "Zoning district", value: "M1-4/R7-2", provenance: "live", source: "NYC MapPLUTO (64uk-42ks)" },
  { agent: "regulatory-policy", label: "Built FAR", value: "0.11", provenance: "live", source: "NYC MapPLUTO (64uk-42ks)" },
  { agent: "regulatory-policy", label: "LIHTC eligibility", value: "Difficult Development Area", provenance: "live", source: "HUD QCT + DDA" },
  { agent: "regulatory-policy", label: "Opportunity Zone", value: "No", provenance: "live", source: "IRS/Treasury QOZ designations" },
];
