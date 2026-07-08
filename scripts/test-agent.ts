// Test harness for KOANO specialist agents.
// Usage: npx tsx scripts/test-agent.ts <agent-name> ["address"]
//   agent-name: regulatory-policy | infrastructure | demand-sentiment | risk-volatility | market-timing

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Load .env.local (tsx does not load it automatically; Next.js does at runtime).
try {
  const env = readFileSync(join(process.cwd(), '.env.local'), 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  // no .env.local — rely on shell env
}

import type { AgentVerdict } from '../lib/agents/shared';
import type { ResolvedAddress } from '../lib/providers/types';

const DEFAULT_ADDRESS = '175 3rd Street, Brooklyn, NY 11215';

async function main() {
  const agentName = process.argv[2];
  const address = process.argv[3] ?? DEFAULT_ADDRESS;

  // Module path + exported runner name per agent. Paths are variables so agents
  // not yet built (Step 4 is one-at-a-time) don't break the typecheck.
  const agents: Record<string, { module: string; runner: string }> = {
    'regulatory-policy': { module: '../lib/agents/regulatory-policy', runner: 'runRegulatoryPolicyAgent' },
    infrastructure: { module: '../lib/agents/infrastructure', runner: 'runInfrastructureAgent' },
    'demand-sentiment': { module: '../lib/agents/demand-sentiment', runner: 'runDemandSentimentAgent' },
    'risk-volatility': { module: '../lib/agents/risk-volatility', runner: 'runRiskVolatilityAgent' },
    'market-timing': { module: '../lib/agents/market-timing', runner: 'runMarketTimingAgent' },
  };

  const spec = agents[agentName ?? ''];
  if (!spec) {
    console.error(
      'Usage: npx tsx scripts/test-agent.ts <regulatory-policy|infrastructure|demand-sentiment|risk-volatility|market-timing> ["address"]'
    );
    process.exit(1);
  }
  const mod = (await import(spec.module)) as Record<string, (addr: ResolvedAddress) => Promise<AgentVerdict>>;
  const run = mod[spec.runner];

  console.log(`\n=== KOANO agent test: ${agentName} ===`);
  console.log(`Address: ${address}\n`);

  const { registry } = await import('../lib/providers/registry');
  const geo = await registry.geocode.resolve(address);
  if (!geo.ok || !geo.data) {
    console.error(`Geocode failed: ${geo.error}`);
    process.exit(1);
  }
  console.log(`Geocoded [${geo.provenance.toUpperCase()}]: ${geo.data.normalized} (BBL ${geo.data.bbl}, tract ${geo.data.tract_geoid})\n`);

  const t0 = Date.now();
  const verdict = await run(geo.data);
  const ms = Date.now() - t0;

  console.log(JSON.stringify(verdict, null, 2));

  console.log(`\n--- summary ---`);
  console.log(`agent:               ${verdict.agent}`);
  console.log(`verdict:             ${verdict.verdict.toUpperCase()} (confidence ${verdict.confidence}, risk ${verdict.risk_score}, window ${verdict.signal_window_months}mo)`);
  console.log(`headline:            ${verdict.headline}`);
  console.log(`overall_provenance:  ${verdict.overall_provenance.toUpperCase()}`);
  console.log(`data points:         ${verdict.data_points.length} (${verdict.data_points.filter((d) => d.provenance === 'live').length} live, ${verdict.data_points.filter((d) => d.provenance === 'representative').length} representative)`);
  console.log(`reasoning steps:     ${verdict.reasoning_chain.length} (all cite sources: ${verdict.reasoning_chain.every((r) => r.sources.length > 0) ? 'YES' : 'NO'})`);
  console.log(`sources:             ${verdict.top_data_sources.join(' | ')}`);
  console.log(`elapsed:             ${ms}ms`);
}

main().catch((e) => {
  console.error('Agent test failed:', e);
  process.exit(1);
});
