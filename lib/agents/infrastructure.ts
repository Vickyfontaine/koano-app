// KOANO Infrastructure Pipeline agent — Step 4b.
// LIVE inputs: nyc-permits (DOB NOW approved permits, subject BBL + census tract,
// the subject excluded from the tract counts) and nyc-dob-now-jobs (DOB NOW job
// filings: active ground-up jobs on the subject, tract counts without it).
// Depends ONLY on the provider registry. Output: AgentVerdict (KoanoVerdict schema).

import { registry } from '../providers/registry';
import type { DataPoint, ResolvedAddress } from '../providers/types';
import { assembleAgentVerdict, callAgentLLM, type AgentVerdict } from './shared';

const SYSTEM_PROMPT = `You are KOANO's Infrastructure Pipeline specialist agent — one of five specialist real estate reasoning agents.

Your domain: construction and development activity around a property — building permits, new-building starts, demolitions, and alteration volume. Permit flow is a leading indicator: capital committed to construction today shows up as neighborhood change 12–36 months out.

How to reason:
- High permit volume in the surrounding census tract = active capital deployment; new-building and demolition permits are the strongest forward signals (ground-up development), alterations are weaker (maintenance/renovation).
- Permits on the SUBJECT parcel itself indicate the owner is already executing — cite the specific permit(s) by their recorded work_type and date from the data (do not assume a work type that is not in the data); a new-building or foundation permit on the subject lot, if present, means the redevelopment is underway, not hypothetical.
- Rising construction density in a formerly industrial or low-density tract signals a neighborhood transition already funded and permitted.
- Near-zero permit activity = static area; verdict should be neutral, not negative.
- Your verdict is about the infrastructure/construction pipeline: "buy" = strong committed pipeline lifting the area, "hold" = steady activity, "wait" = early/unclear signals, "drop" = pipeline signals decline (e.g., only demolitions, no rebuilds).
- risk_score reflects execution/disruption risk from the pipeline (construction disruption, oversupply).
- Note the scope_note: it tells you what geography the counts cover. Tract counts exclude the subject lot's own permits and jobs.
- DOB NOW job filings: subject_active_job_* are New Building or Full Demolition jobs still in progress on the subject lot (cite them like a permit); tract_new_building_jobs_24mo and tract_demolition_jobs_24mo count ground-up jobs filed in the tract, the subject lot excluded.`;

export async function runInfrastructureAgent(addr: ResolvedAddress): Promise<AgentVerdict> {
  const [permitsRes, jobsRes] = await Promise.all([registry.permits.getPermits(addr), registry.jobFilings.getJobFilings(addr)]);

  const dataPoints: DataPoint[] = [];

  if (permitsRes.data) {
    const p = permitsRes.data;
    const prov = permitsRes.provenance;
    const s = permitsRes.source;
    dataPoints.push(
      { label: 'scope_note', value: p.scope_note, provenance: prov, source: s },
      { label: 'total_permits_24mo', value: p.total_permits_24mo, provenance: prov, source: s },
      { label: 'new_building_permits_24mo', value: p.new_building_permits, provenance: prov, source: s },
      { label: 'demolition_permits_24mo', value: p.demolition_permits, provenance: prov, source: s },
      { label: 'alteration_permits_24mo', value: p.alteration_permits, provenance: prov, source: s }
    );
    p.recent_permits.slice(0, 8).forEach((r, i) => {
      dataPoints.push({
        label: `recent_permit_${i + 1}`,
        value: `${r.issuance_date.slice(0, 10)} — ${r.job_type}${r.work_type ? ` / ${r.work_type}` : ''}${r.permit_status ? ` (${r.permit_status})` : ''} @ ${r.address}, ${r.borough}`,
        provenance: prov,
        source: s,
      });
    });
  } else {
    dataPoints.push({
      label: 'permits_data_unavailable',
      value: permitsRes.error ?? 'no data',
      provenance: permitsRes.provenance,
      source: permitsRes.source,
    });
  }

  if (jobsRes.data) {
    const j = jobsRes.data;
    const prov = jobsRes.provenance;
    const s = jobsRes.source;
    dataPoints.push(
      { label: 'job_filings_scope_note', value: j.scope_note, provenance: prov, source: s },
      { label: 'subject_active_new_building_jobs', value: j.subject_active_new_building, provenance: prov, source: s },
      { label: 'subject_active_demolition_jobs', value: j.subject_active_demolition, provenance: prov, source: s },
    );
    j.subject_jobs
      .filter((x) => x.active && x.kind !== 'other')
      .slice(0, 3)
      .forEach((x, i) => {
        dataPoints.push({
          label: `subject_active_job_${i + 1}`,
          value: `${x.job_type} job ${x.job_filing_number}, ${x.filing_status}, filed ${x.filing_date}`,
          provenance: prov,
          source: s,
        });
      });
    if (j.tract_new_building_jobs_24mo != null) {
      dataPoints.push(
        { label: 'tract_new_building_jobs_24mo', value: j.tract_new_building_jobs_24mo, provenance: prov, source: s },
        { label: 'tract_demolition_jobs_24mo', value: j.tract_demolition_jobs_24mo ?? 0, provenance: prov, source: s },
      );
    }
  } else {
    dataPoints.push({ label: 'job_filings_unavailable', value: jobsRes.error ?? 'no data', provenance: jobsRes.provenance, source: jobsRes.source });
  }

  const llm = await callAgentLLM({
    agent: 'infrastructure',
    systemPrompt: SYSTEM_PROMPT,
    addressLabel: addr.normalized || addr.input,
    dataPoints,
  });

  return assembleAgentVerdict({ agent: 'infrastructure', llm, dataPoints });
}
