// FHFA House Price Index — master CSV download, filtered to the New York MSA
// (CBSA 35620). Cached in-module for the process lifetime (file is ~10MB).

import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { HpiProvider, HpiTrend, ProviderResult, ResolvedAddress } from '../types';
import { errMsg, fetchText } from './http';

const CSV_URLS = [
  'https://www.fhfa.gov/hpi/download/monthly/hpi_master.csv',
  'https://www.fhfa.gov/DataTools/Downloads/Documents/HPI/HPI_master.csv',
];
const NY_MSA_ID = '35614'; // New York-Jersey City-White Plains, NY-NJ (MSAD) — FHFA publishes the metro division, not CBSA 35620
const DISK_CACHE = join(tmpdir(), 'koano-fhfa-hpi-master.csv');
const DISK_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // FHFA updates quarterly; 24h is plenty

async function readDiskCache(): Promise<string | null> {
  try {
    const s = await stat(DISK_CACHE);
    if (Date.now() - s.mtimeMs > DISK_CACHE_TTL_MS) return null;
    return await readFile(DISK_CACHE, 'utf8');
  } catch {
    return null;
  }
}

async function writeDiskCache(csv: string): Promise<void> {
  try {
    await mkdir(tmpdir(), { recursive: true });
    await writeFile(DISK_CACHE, csv, 'utf8');
  } catch {
    // cache write is best-effort
  }
}

interface HpiRow {
  yr: number;
  period: number;
  index_nsa: number;
}

// Quote-aware CSV line parser — place_name contains embedded commas
// (e.g. "New York-Newark-Jersey City, NY-NJ-PA").
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur.replace(/\r$/, ''));
  return out;
}

let cache: { rows: HpiRow[]; endpoint: string } | null = null;

async function loadNyMsaRows(): Promise<{ rows: HpiRow[]; endpoint: string }> {
  if (cache) return cache;
  let lastErr = '';

  // Try 24h disk cache first — FHFA rate-blocks repeated large downloads.
  const cached = await readDiskCache();
  const sources: Array<{ url: string; csv: string | null }> = cached
    ? [{ url: `${DISK_CACHE} (24h disk cache of ${CSV_URLS[0]})`, csv: cached }]
    : CSV_URLS.map((url) => ({ url, csv: null }));

  for (const src of sources) {
    const url = src.url;
    try {
      let csv = src.csv;
      if (csv === null) {
        // FHFA blocks non-browser user agents (404) — send a browser UA.
        csv = await fetchText(url, {
          timeoutMs: 90000,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
            Accept: 'text/csv,*/*',
          },
        });
        await writeDiskCache(csv);
      }
      const lines = csv.split('\n');
      const header = parseCsvLine(lines[0]);
      const idx = {
        hpi_type: header.indexOf('hpi_type'),
        hpi_flavor: header.indexOf('hpi_flavor'),
        frequency: header.indexOf('frequency'),
        place_id: header.indexOf('place_id'),
        yr: header.indexOf('yr'),
        period: header.indexOf('period'),
        index_nsa: header.indexOf('index_nsa'),
      };
      const rows: HpiRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.includes(NY_MSA_ID)) continue;
        const cols = parseCsvLine(line);
        if (
          cols[idx.place_id] === NY_MSA_ID &&
          cols[idx.hpi_type] === 'traditional' &&
          cols[idx.hpi_flavor] === 'all-transactions' &&
          cols[idx.frequency] === 'quarterly'
        ) {
          const yr = Number(cols[idx.yr]);
          const period = Number(cols[idx.period]);
          const index_nsa = Number(cols[idx.index_nsa]);
          if (Number.isFinite(yr) && Number.isFinite(index_nsa)) rows.push({ yr, period, index_nsa });
        }
      }
      if (rows.length === 0) throw new Error('No NY MSA rows found in FHFA master file');
      rows.sort((a, b) => a.yr - b.yr || a.period - b.period);
      cache = { rows, endpoint: url };
      return cache;
    } catch (e) {
      lastErr = errMsg(e);
    }
  }
  throw new Error(lastErr);
}

const REPRESENTATIVE_FALLBACK: HpiTrend = {
  region: 'New York-Jersey City-White Plains, NY-NJ (REPRESENTATIVE — live FHFA download failed)',
  region_type: 'MSA',
  latest_period: 'recent quarter',
  latest_index: 400,
  yoy_change_pct: 4.5,
  five_yr_change_pct: 38,
};

export const fhfaHpi: HpiProvider = {
  name: 'FHFA House Price Index',

  async getHpi(_addr: ResolvedAddress): Promise<ProviderResult<HpiTrend>> {
    const fetched_at = new Date().toISOString();
    try {
      const { rows, endpoint } = await loadNyMsaRows();
      const latest = rows[rows.length - 1];
      const yearAgo = rows[rows.length - 5]; // 4 quarters back
      const fiveYrAgo = rows[rows.length - 21]; // 20 quarters back

      const pct = (from?: HpiRow) =>
        from ? Number((((latest.index_nsa - from.index_nsa) / from.index_nsa) * 100).toFixed(1)) : null;

      const data: HpiTrend = {
        region: 'New York-Jersey City-White Plains, NY-NJ',
        region_type: 'Metropolitan Division (35614)',
        latest_period: `${latest.yr} Q${latest.period}`,
        latest_index: latest.index_nsa,
        yoy_change_pct: pct(yearAgo),
        five_yr_change_pct: pct(fiveYrAgo),
      };

      return {
        ok: true,
        data,
        provenance: 'live',
        source: 'FHFA House Price Index (all-transactions, quarterly)',
        endpoint,
        fetched_at,
      };
    } catch (e) {
      return {
        ok: true,
        data: REPRESENTATIVE_FALLBACK,
        provenance: 'representative',
        source: 'FHFA House Price Index [FALLBACK]',
        fetched_at,
        error: `Live call failed: ${errMsg(e)}`,
      };
    }
  },
};
