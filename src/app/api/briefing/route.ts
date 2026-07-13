// KOANO portfolio briefing API — Checkpoint 4, Cluster 5.
// POST → Monday-morning-format briefing generated from the user's tracked
// portfolio: latest verdicts (audit trail) + live permits/flood/HPI.
// Clerk-protected. The response is GENERATED text with the provenance rollup
// of its inputs — the UI labels it.

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../../../lib/supabase/server';
import { generateBriefing, type BriefingProperty } from '../../../../lib/agents/briefing';
import { guardSpend } from '../../../../lib/koano-guard';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [propsRes, verdictsRes] = await Promise.all([
    supabaseAdmin()
      .from('properties')
      .select('address_normalized, address_input, bbl')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: true }),
    supabaseAdmin()
      .from('verdicts')
      .select('bbl, address_normalized, verdict, confidence, risk_score, overall_provenance, headline, created_at')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  if (propsRes.error) return NextResponse.json({ error: propsRes.error.message }, { status: 500 });
  if (verdictsRes.error) return NextResponse.json({ error: verdictsRes.error.message }, { status: 500 });

  const verdicts = verdictsRes.data ?? [];
  const properties: BriefingProperty[] = (propsRes.data ?? []).map((p) => {
    const latest = verdicts.find(
      (v) =>
        (p.bbl && v.bbl === p.bbl) ||
        (p.address_normalized && v.address_normalized === p.address_normalized),
    );
    return {
      address: p.address_normalized ?? p.address_input,
      bbl: p.bbl,
      latest_verdict: latest
        ? {
            verdict: latest.verdict,
            confidence: latest.confidence,
            risk_score: latest.risk_score,
            overall_provenance: latest.overall_provenance,
            headline: latest.headline,
            created_at: latest.created_at,
          }
        : null,
    };
  });

  if (properties.length === 0) {
    return NextResponse.json(
      { error: 'No properties in your portfolio yet — add properties first' },
      { status: 400 },
    );
  }

  // Spend guard after the free empty-portfolio check (no wasted slot):
  // approval + shared narrative/briefing rate limit + circuit breaker.
  const guard = await guardSpend({ userId, kind: 'content', route: '/api/briefing' });
  if (!guard.ok) {
    return NextResponse.json(guard.body, { status: guard.status });
  }

  try {
    const result = await generateBriefing(properties);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'briefing generation failed' },
      { status: 422 },
    );
  }
}
