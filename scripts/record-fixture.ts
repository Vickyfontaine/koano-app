// Record the Phase 5 regression fixture: one LIVE run of the full pipeline on a
// known NYC address, freezing every provider result and raw LLM completion, plus
// the resulting decision surface. Replayed offline by test-fixture.ts.
// Usage: npx tsx scripts/record-fixture.ts
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from './_loadenv';
loadEnv();
import { registry } from '../lib/providers/registry';
import { runKoanoPipeline } from '../lib/agents/synthesis';
import { installProviderCassette, beginRecord, dumpRecords, stop } from '../lib/testing/cassette';
import { decisionSurface } from './lib/decision-surface';

const ADDRESS = '175 3rd Street, Brooklyn, NY';
const FIXTURE_DIR = join(process.cwd(), 'scripts', 'fixtures');
const FIXTURE_PATH = join(FIXTURE_DIR, 'nyc-175-3rd-st.json');

(async () => {
  let git = 'unknown';
  try {
    git = execSync('git rev-parse HEAD').toString().trim();
  } catch {
    /* not fatal */
  }

  installProviderCassette(registry as unknown as Record<string, unknown>);
  beginRecord();
  const result = await runKoanoPipeline(ADDRESS);
  const records = dumpRecords();
  stop();

  const expected = decisionSurface(result);
  const providerRecs = records.filter((r) => r.key.startsWith('provider:')).length;
  const llmRecs = records.filter((r) => r.key.startsWith('llm#')).length;

  mkdirSync(FIXTURE_DIR, { recursive: true });
  writeFileSync(
    FIXTURE_PATH,
    JSON.stringify(
      {
        note: 'KOANO Phase 5 regression fixture. Frozen provider results + raw LLM completions + the expected DECISION SURFACE. Replayed offline by scripts/test-fixture.ts. Re-record only on an intended decision change or a model change; never hand-edit.',
        address: ADDRESS,
        recorded_at: new Date().toISOString(),
        git_commit: git,
        record_counts: { providers: providerRecs, llm: llmRecs, total: records.length },
        expected,
        records,
      },
      null,
      2,
    ),
  );

  console.log(`\n✓ Recorded fixture → ${FIXTURE_PATH}`);
  console.log(`  git ${git.slice(0, 12)} | ${providerRecs} provider records, ${llmRecs} LLM records`);
  console.log(
    `  decision: ${expected.verdict.toUpperCase()} conf ${expected.confidence} risk ${expected.risk_score} ` +
      `prov ${expected.overall_provenance} | agent-score ${expected.breakdown.aggregate_score} ` +
      `+ nudge ${expected.breakdown.structural_nudge} = ${expected.breakdown.final_score}`,
  );
  console.log(
    `  agents: ${expected.agents.map((a) => `${a.agent.slice(0, 4)}:${a.verdict}/${a.confidence}/r${a.risk_score}`).join('  ')}\n`,
  );
  process.exit(0);
})();
