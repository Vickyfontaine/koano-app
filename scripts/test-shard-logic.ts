// Unit tests for the daily archive fan-out — pure logic, no DB.
//   npm run test:shards
// Covers the three things that must be right: (1) same captured_week across the
// week / correct day→shard + property→shard mapping; (2) gap detection understands
// the shape — a missed DAY is a gap, not "6 of 7 passed"; (3) genesis guard so the
// first day is silent.

import { isoWeekMonday, isoDayShard, propertyShard, priorMonday, computeShardGaps } from '../lib/archive/capture';

let failures = 0;
function ok(cond: boolean, msg: string) { if (cond) console.log(`  ✓ ${msg}`); else { console.error(`  ✗ ${msg}`); failures++; } }

// =============================================================================
console.log('\n[1] captured_week is the SAME ISO Monday for every day of a week');
// 2026-08-17 is a Monday. Every day that week must map to it.
const weekDates = ['2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21', '2026-08-22', '2026-08-23'];
const mondays = weekDates.map((d) => isoWeekMonday(new Date(`${d}T10:00:00Z`)));
ok(mondays.every((m) => m === '2026-08-17'), `all 7 days → captured_week 2026-08-17 (${Array.from(new Set(mondays)).join(',')})`);

console.log('\n[1b] day → shard: Monday=0 … Sunday=6');
const shards = weekDates.map((d) => isoDayShard(new Date(`${d}T10:00:00Z`)));
ok(JSON.stringify(shards) === JSON.stringify([0, 1, 2, 3, 4, 5, 6]), `Mon..Sun → 0..6 (${shards.join(',')})`);

console.log('\n[1c] property → shard: deterministic, in [0,6], spread');
const bbls = ['3009720058', '4007070001', '1000267501', '3012340012', '2029990033', '4012345678', '1099887766', '3055556666', '5011112222', '2033334444', '1077778888', '4099990000', '3022221111', '2044445555'];
ok(bbls.every((b) => propertyShard(b) === propertyShard(b)), 'propertyShard is deterministic');
ok(bbls.every((b) => propertyShard(b) >= 0 && propertyShard(b) <= 6), 'propertyShard ∈ [0,6]');
const buckets = new Set(bbls.map(propertyShard));
ok(buckets.size >= 5, `spreads across shards (${buckets.size} of 7 buckets hit by ${bbls.length} BBLs)`);

console.log('\n[1d] priorMonday');
ok(priorMonday('2026-08-17') === '2026-08-10', 'priorMonday(2026-08-17) = 2026-08-10');

// =============================================================================
console.log('\n[2] GAP DETECTION — a missed DAY is a gap, not "6 of 7 passed"');
const WK = '2026-08-17';
const PRIOR = '2026-08-10';
const ranSet = (slots: Array<[string, number]>) => {
  const s = new Set(slots.map(([w, sh]) => `${w}|${sh}`));
  return (w: string, sh: number) => s.has(`${w}|${sh}`);
};
const genesisAt = (w: string, sh: number) => ({ week: w, shard: sh });

// Yesterday ran → no gap. (Wednesday=shard 2; yesterday=Tuesday shard 1.)
ok(computeShardGaps(WK, 2, genesisAt(WK, 0), ranSet([[WK, 0], [WK, 1]])).length === 0, 'yesterday ran → no gap');

// Yesterday MISSED → gap. (Wed shard 2, but Tue shard 1 never ran.)
{ const g = computeShardGaps(WK, 2, genesisAt(WK, 0), ranSet([[WK, 0]]));
  ok(g.length === 1 && /shard 1 of week 2026-08-17 did not run/.test(g[0]), 'yesterday missed → gap flags shard 1'); }

// Monday completeness: prior week missing 1 of 7 → gap (NOT "6 of 7 passed").
{ const priorRan: Array<[string, number]> = [[PRIOR, 0], [PRIOR, 1], [PRIOR, 2], [PRIOR, 3], [PRIOR, 4], [PRIOR, 6]]; // shard 5 missing
  const g = computeShardGaps(WK, 0, genesisAt(PRIOR, 0), ranSet([...priorRan, [priorMonday(WK), 6] /* two-weeks-ago sun for yesterday check */]));
  ok(g.some((x) => /week 2026-08-10 is INCOMPLETE/.test(x) && /shard\(s\) 5/.test(x)), 'Monday: prior week missing shard 5 → INCOMPLETE gap (not 6/7 pass)'); }

// Monday completeness: all 7 prior shards ran → no week-incomplete gap.
{ const priorRan: Array<[string, number]> = [0, 1, 2, 3, 4, 5, 6].map((s) => [PRIOR, s] as [string, number]);
  const g = computeShardGaps(WK, 0, genesisAt(PRIOR, 0), ranSet([...priorRan]));
  ok(!g.some((x) => /INCOMPLETE/.test(x)), 'Monday: all 7 prior shards ran → no incomplete-week gap'); }

// =============================================================================
console.log('\n[3] GENESIS GUARD — the first day is silent, pre-daily weeks not flagged');
// No sharded run yet → genesis null → never any gap.
ok(computeShardGaps(WK, 3, null, ranSet([])).length === 0, 'no genesis (daily model not established) → no gaps ever');

// First-ever daily run is TODAY (genesis = today's slot). Yesterday is BEFORE
// genesis → not flagged. This is the daily first-run-silent guarantee.
ok(computeShardGaps(WK, 2, genesisAt(WK, 2), ranSet([])).length === 0, "first daily run today → yesterday is pre-genesis → silent (no false wave)");

// Slots before genesis are never gaps even if unran.
ok(computeShardGaps(WK, 0, genesisAt(WK, 0), ranSet([])).length === 0, 'Monday genesis, prior week entirely pre-genesis → no gap');

console.log(`\n${failures === 0 ? '✓ ALL SHARD-LOGIC CHECKS PASSED' : `✗ ${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
