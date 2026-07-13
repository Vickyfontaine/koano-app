// KOANO profile API — Checkpoint 1 (Phase B).
// GET  → the requesting user's profile row (or null if none yet).
// POST { cluster } → upserts the profile with the chosen cluster.
// Clerk-protected: unauthenticated requests get 401. Writes go through the
// Supabase service role server-side; RLS still guards direct client access.

import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

const VALID_CLUSTERS = ['cluster_1', 'cluster_2', 'cluster_4', 'cluster_5'] as const;
type ClusterId = (typeof VALID_CLUSTERS)[number];

function isClusterId(value: unknown): value is ClusterId {
  return typeof value === 'string' && (VALID_CLUSTERS as readonly string[]).includes(value);
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin()
    .from('profiles')
    .select('clerk_user_id, email, cluster, created_at, updated_at')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: data });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { cluster?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!isClusterId(body.cluster)) {
    return NextResponse.json(
      { error: '"cluster" must be one of cluster_1, cluster_2, cluster_4, cluster_5' },
      { status: 400 },
    );
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  const { data, error } = await supabaseAdmin()
    .from('profiles')
    .upsert(
      {
        clerk_user_id: userId,
        email,
        cluster: body.cluster,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'clerk_user_id' },
    )
    .select('clerk_user_id, email, cluster, created_at, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: data });
}
