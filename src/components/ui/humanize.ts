// Display labels for engine data-point keys (UI sprint final review). The
// engine's keys are stable identifiers (snake_case, unit suffixes); a reader
// of the ledger or a Trace thread should see words. Pure, deterministic, and
// it never changes the key the data carries.

const WORDS: Record<string, string> = {
  pct: "%",
  usd: "$",
  yoy: "year over year",
  sqft: "sq ft",
  sf: "sq ft",
  hpi: "HPI",
  fema: "FEMA",
  epa: "EPA",
  nypd: "NYPD",
  hpd: "HPD",
  dob: "DOB",
  ecb: "ECB",
  far: "FAR",
  acs: "ACS",
  hmda: "HMDA",
  qcew: "QCEW",
  bps: "BPS",
  nri: "NRI",
  lihtc: "LIHTC",
  qct: "QCT",
  dda: "DDA",
  oz: "Opportunity Zone",
  ytd: "year to date",
  mo: "months",
  yr: "year",
  "5yr": "5 year",
  "24mo": "24 months",
  "12mo": "12 months",
  bbl: "BBL",
  msa: "MSA",
  pga: "PGA",
  id: "ID",
};

export function humanizeLabel(key: string): string {
  // Keep any parenthetical the engine added (a period, a region).
  const m = key.match(/^([^(]*?)\s*(\(.*\))?\s*$/);
  const base = (m?.[1] ?? key).trim();
  const paren = m?.[2] ?? "";
  if (!/[_]/.test(base) && base !== base.toLowerCase()) return key; // already prose
  const words = base
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => WORDS[w.toLowerCase()] ?? w);
  let out = words.join(" ");
  out = out.replace(/\b\$ (\w)/g, "$ $1").replace(/\s+%/g, " %").replace(/^(\w)/, (c) => c.toUpperCase());
  return paren ? `${out} ${paren}` : out;
}
