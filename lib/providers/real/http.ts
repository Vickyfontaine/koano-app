// Shared HTTP helpers for real providers: timeout, one retry, 429 backoff.

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface FetchOpts {
  timeoutMs?: number;
  retries?: number;
  headers?: Record<string, string>;
}

// NYC Open Data (Socrata) app token — optional but recommended in production:
// anonymous requests share a per-IP throttle (and Vercel egress IPs are
// shared). Set NYC_OPEN_DATA_APP_TOKEN to get a dedicated quota; everything
// works without it.
function socrataHeaders(url: string): Record<string, string> {
  const token = process.env.NYC_OPEN_DATA_APP_TOKEN;
  if (token && url.includes('data.cityofnewyork.us')) {
    return { 'X-App-Token': token };
  }
  return {};
}

async function fetchRaw(url: string, opts: FetchOpts = {}): Promise<Response> {
  // Default to 3 retries: the pipeline fires all five agents in parallel, so
  // many Socrata calls hit the shared per-IP throttle at once. One retry wasn't
  // enough — a throttled call fell back to representative and silently changed
  // an agent's INPUT between runs, making the verdict nondeterministic even with
  // temp-0 agents. (Setting NYC_OPEN_DATA_APP_TOKEN removes the throttle in prod.)
  const { timeoutMs = 20000, retries = 3 } = opts;
  const headers = { ...socrataHeaders(url), ...opts.headers };
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { headers, signal: ctrl.signal });
      if (res.status === 429) {
        // rate limited — back off and retry once
        lastErr = new Error('HTTP 429 (rate limited)');
        await sleep(1500 * (attempt + 1));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt < retries) await sleep(600 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export async function fetchJson<T>(url: string, opts: FetchOpts = {}): Promise<T> {
  const res = await fetchRaw(url, opts);
  return (await res.json()) as T;
}

export async function fetchText(url: string, opts: FetchOpts = {}): Promise<string> {
  const res = await fetchRaw(url, opts);
  return await res.text();
}

export function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
