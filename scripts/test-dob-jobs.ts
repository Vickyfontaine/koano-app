// DOB NOW job filings and landmark status (Phase 0): job-type classification,
// the active-status rule, and the construction guard reading an active
// ground-up job or an LPC designation on the subject lot.
//   npx tsx scripts/test-dob-jobs.ts
import { classifyJob, isActiveFiling } from '../lib/providers/real/nyc-dob-now-jobs';
import { extractStructuralFacts, occupancyGuard } from '../lib/agents/direction';
import type { AgentVerdict } from '../lib/agents/shared';

let fail = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
};

eq('New Building is new_building', classifyJob('New Building'), 'new_building');
eq('Full Demolition is demolition', classifyJob('Full Demolition'), 'demolition');
eq('ALT-CO is other', classifyJob('ALT-CO - New Building with Existing Elements to Remain'), 'other');
eq('Alteration is other', classifyJob('Alteration'), 'other');
for (const s of ['Approved', 'Permit Entire', 'Permit Issued', 'Objections', 'Plan Examiner Review', 'On Hold - Pending Supersede of Applicant of Record'])
  eq(`"${s}" is active`, isActiveFiling(s), true);
for (const s of ['LOC Issued', 'CO Issued', 'Full Demolition Signed-off', 'Filing Withdrawn', 'LL 158-2017-Denied', 'TA Certificate of Operation Issued'])
  eq(`"${s}" is closed`, isActiveFiling(s), false);

const dp = (label: string, value: string | number) => ({ label, value, provenance: 'live' as const, source: 't', fetched_at: '' });
const agent = (points: ReturnType<typeof dp>[]) => ({ agent: 'infrastructure', data_points: points }) as unknown as AgentVerdict;

const withJob = extractStructuralFacts([agent([dp('subject_active_job_1', 'New Building job B00680917-Z3, Approved, filed 2026-04-10')])], '175 3 STREET, Brooklyn, NY, USA');
eq('an active job on the subject feeds the guard', withJob.subjectActiveConstruction, ['New Building job B00680917-Z3 (Approved, filed 2026-04-10)']);
eq('the guard fires as active construction', occupancyGuard(withJob)?.guard, 'active_construction');

const without = extractStructuralFacts([agent([dp('tract_new_building_jobs_24mo', 24)])], '175 3 STREET, Brooklyn, NY, USA');
eq('tract jobs alone do not fire the guard', occupancyGuard(without), null);

// Landmark status (Phase 0) feeds the same guard.
const lm = extractStructuralFacts([agent([dp('individual_landmark', 'INDIVIDUAL AND INTERIOR LANDMARK'), dp('historic_district', 'none')])], '55 WALL STREET');
eq('an individual landmark fires the landmark guard', occupancyGuard(lm)?.guard, 'landmark');
const hd = extractStructuralFacts([agent([dp('individual_landmark', 'none'), dp('historic_district', 'Park Slope Historic District')])], '1 X STREET');
eq('a historic district fires the landmark guard', occupancyGuard(hd)?.guard, 'landmark');
const none = extractStructuralFacts([agent([dp('individual_landmark', 'none'), dp('historic_district', 'none')])], '1 X STREET');
eq('"none" does not fire it', occupancyGuard(none), null);

if (fail) process.exit(1);
console.log('✓ DOB NOW job filings and landmark status');
