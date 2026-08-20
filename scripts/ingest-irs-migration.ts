// One-time (annual) ingestion of IRS SOI county-to-county migration into the
// self-hosted irs_migration table. IRS publishes bulk CSVs only — no API — so we
// ingest the per-county TOTAL rows the files already provide:
//   inflow  file: origin  y1 = 96/000 ("Total Migration-US and Foreign") per destination county
//   outflow file: destination y2 = 96/000 per origin county
//
// Run AFTER migration-012-irs-migration.sql is applied:
//   npx tsx scripts/ingest-irs-migration.ts
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

// --- env ---
try {
  const env = readFileSync(join(process.cwd(), '.env.local'), 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  /* rely on shell env */
}

const VINTAGE = '2021-2022';
const INFLOW = 'https://www.irs.gov/pub/irs-soi/countyinflow2223.csv';
const OUTFLOW = 'https://www.irs.gov/pub/irs-soi/countyoutflow2223.csv';

interface Agg {
  fips_state: string;
  fips_county: string;
  vintage: string;
  inflow_returns?: number;
  inflow_agi_thousands?: number;
  outflow_returns?: number;
  outflow_agi_thousands?: number;
}

function pad(v: string, n: number): string {
  return v.trim().replace(/"/g, '').padStart(n, '0');
}

async function fetchCsv(url: string): Promise<string[][]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  const text = await res.text();
  return text.split('\n').filter((l) => l.trim()).map((l) => l.split(','));
}

async function main() {
  const rows = new Map<string, Agg>();
  const keyOf = (s: string, c: string) => `${s}|${c}`;

  // INFLOW: total row where origin (y1) = 96/000, keyed by destination (y2).
  const inflow = await fetchCsv(INFLOW);
  const inHeader = inflow[0].map((h) => h.replace(/"/g, '').trim());
  const ci = (n: string) => inHeader.indexOf(n);
  const [iY2S, iY2C, iY1S, iY1C, iN1, iAgi] = [ci('y2_statefips'), ci('y2_countyfips'), ci('y1_statefips'), ci('y1_countyfips'), ci('n1'), ci('agi')];
  let inCount = 0;
  for (const f of inflow.slice(1)) {
    if (pad(f[iY1S], 2) === '96' && pad(f[iY1C], 3) === '000') {
      const s = pad(f[iY2S], 2), c = pad(f[iY2C], 3);
      const k = keyOf(s, c);
      const agg = rows.get(k) ?? { fips_state: s, fips_county: c, vintage: VINTAGE };
      agg.inflow_returns = Number(f[iN1]);
      agg.inflow_agi_thousands = Number(f[iAgi]);
      rows.set(k, agg);
      inCount++;
    }
  }

  // OUTFLOW: total row where destination (y2) = 96/000, keyed by origin (y1).
  const outflow = await fetchCsv(OUTFLOW);
  const outHeader = outflow[0].map((h) => h.replace(/"/g, '').trim());
  const co = (n: string) => outHeader.indexOf(n);
  const [oY2S, oY2C, oY1S, oY1C, oN1, oAgi] = [co('y2_statefips'), co('y2_countyfips'), co('y1_statefips'), co('y1_countyfips'), co('n1'), co('agi')];
  let outCount = 0;
  for (const f of outflow.slice(1)) {
    if (pad(f[oY2S], 2) === '96' && pad(f[oY2C], 3) === '000') {
      const s = pad(f[oY1S], 2), c = pad(f[oY1C], 3);
      const k = keyOf(s, c);
      const agg = rows.get(k) ?? { fips_state: s, fips_county: c, vintage: VINTAGE };
      agg.outflow_returns = Number(f[oN1]);
      agg.outflow_agi_thousands = Number(f[oAgi]);
      rows.set(k, agg);
      outCount++;
    }
  }

  console.log(`Parsed ${inCount} inflow totals, ${outCount} outflow totals → ${rows.size} counties (vintage ${VINTAGE}).`);

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const all = Array.from(rows.values());
  let written = 0;
  for (let i = 0; i < all.length; i += 500) {
    const batch = all.slice(i, i + 500);
    const { error } = await admin.from('irs_migration').upsert(batch, { onConflict: 'fips_state,fips_county,vintage' });
    if (error) throw new Error(`upsert failed at ${i}: ${error.message}`);
    written += batch.length;
    process.stdout.write(`\r  upserted ${written}/${all.length}`);
  }
  console.log(`\n✓ ingested ${written} county rows into irs_migration.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
