// Google Trends search interest for the neighborhood. Google has no official
// Trends API; the unofficial widget endpoints are attempted live and are known
// to be rate-limited/blocked from server IPs. On failure this falls back to a
// clearly labeled representative response — never a silent fake.

import type { ProviderResult, ResolvedAddress, SearchTrendsInfo, SearchTrendsProvider } from '../types';
import { errMsg, fetchText } from './http';

function neighborhoodTerm(addr: ResolvedAddress): string {
  // e.g. "Gowanus Brooklyn real estate" — derived from borough + street context
  const boro = addr.borough ?? 'New York';
  return `${boro} real estate`;
}

const REPRESENTATIVE_FALLBACK = (term: string): SearchTrendsInfo => ({
  term: `${term} (REPRESENTATIVE — Google Trends has no official API; unofficial endpoint blocked)`,
  geo: 'US-NY',
  interest_current: 72,
  interest_12mo_avg: 64,
  momentum: 'rising',
});

export const googleTrends: SearchTrendsProvider = {
  name: 'Google Trends (unofficial)',

  async getSearchTrends(addr: ResolvedAddress): Promise<ProviderResult<SearchTrendsInfo>> {
    const fetched_at = new Date().toISOString();
    const term = neighborhoodTerm(addr);
    const exploreUrl =
      `https://trends.google.com/trends/api/explore?hl=en-US&tz=300&req=` +
      encodeURIComponent(
        JSON.stringify({
          comparisonItem: [{ keyword: term, geo: 'US-NY', time: 'today 12-m' }],
          category: 0,
          property: '',
        })
      );

    try {
      // Google prefixes anti-JSON garbage: ")]}'\n"
      const raw = await fetchText(exploreUrl, {
        retries: 0,
        timeoutMs: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      });
      const json = JSON.parse(raw.replace(/^\)\]\}'/, ''));
      const widget = json?.widgets?.find((w: { id?: string }) => w.id === 'TIMESERIES');
      if (!widget?.token) throw new Error('No TIMESERIES widget token in explore response');

      const dataUrl =
        `https://trends.google.com/trends/api/widgetdata/multiline?hl=en-US&tz=300` +
        `&req=${encodeURIComponent(JSON.stringify(widget.request))}&token=${widget.token}`;
      const rawData = await fetchText(dataUrl, {
        retries: 0,
        timeoutMs: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      });
      const series = JSON.parse(rawData.replace(/^\)\]\}'/, ''))?.default?.timelineData as Array<{
        value?: number[];
      }>;
      if (!Array.isArray(series) || series.length === 0) throw new Error('Empty timeline data');

      const values = series.map((p) => p.value?.[0] ?? 0);
      const current = values[values.length - 1];
      const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
      const recent = values.slice(-8).reduce((a, b) => a + b, 0) / 8;
      const earlier = values.slice(0, 8).reduce((a, b) => a + b, 0) / 8;

      return {
        ok: true,
        data: {
          term,
          geo: 'US-NY',
          interest_current: current,
          interest_12mo_avg: avg,
          momentum: recent > earlier * 1.1 ? 'rising' : recent < earlier * 0.9 ? 'falling' : 'flat',
        },
        provenance: 'live',
        source: 'Google Trends (unofficial widget API)',
        endpoint: exploreUrl,
        fetched_at,
      };
    } catch (e) {
      return {
        ok: true,
        data: REPRESENTATIVE_FALLBACK(term),
        provenance: 'representative',
        source: 'Google Trends [FALLBACK]',
        endpoint: exploreUrl,
        fetched_at,
        error: `Live call failed: ${errMsg(e)}`,
      };
    }
  },
};
