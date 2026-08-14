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
    .select(
      'clerk_user_id, email, cluster, plan, access_status, created_at, updated_at, ' +
        'full_name, company_name, license_number, phone, contact_email, logo_url, headshot_url',
    )
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: data });
}

// ---------------------------------------------------------------------------
// PATCH { full_name?, company_name?, license_number?, phone?, contact_email? }
// Updates the letterhead identity fields (migration 005). Every field is
// optional; only keys present in the body are touched. An empty/whitespace
// string clears the field (→ null). logo_url / headshot_url are NOT accepted
// here — they are set only by the /api/profile/asset upload route.
// ---------------------------------------------------------------------------

const TEXT_FIELDS = ['full_name', 'company_name', 'license_number', 'phone', 'contact_email'] as const;
type TextField = (typeof TEXT_FIELDS)[number];

const MAX_LEN: Record<TextField, number> = {
  full_name: 120,
  company_name: 120,
  license_number: 60,
  phone: 40,
  contact_email: 160,
};

// Returns { value } (trimmed, or null when empty) or { error } on invalid input.
function validateField(field: TextField, raw: unknown): { value: string | null } | { error: string } {
  if (raw === null) return { value: null };
  if (typeof raw !== 'string') return { error: `"${field}" must be a string` };
  const v = raw.trim();
  if (v === '') return { value: null };
  if (v.length > MAX_LEN[field]) return { error: `"${field}" must be ${MAX_LEN[field]} characters or fewer` };
  if (field === 'contact_email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    return { error: 'contact_email must be a valid email address' };
  }
  if (field === 'phone' && !/^[0-9+()\-.\s]+$/.test(v)) {
    return { error: 'phone may contain only digits and + ( ) - . and spaces' };
  }
  return { value: v };
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const update: Partial<Record<TextField, string | null>> = {};
  for (const field of TEXT_FIELDS) {
    if (!(field in body)) continue; // only touch provided keys
    const result = validateField(field, body[field]);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    update[field] = result.value;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: `No updatable fields provided. Allowed: ${TEXT_FIELDS.join(', ')}.` },
      { status: 400 },
    );
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  // Upsert on clerk_user_id: only the provided columns (+ email/updated_at) are
  // written, so cluster/plan are never clobbered.
  const { data, error } = await supabaseAdmin()
    .from('profiles')
    .upsert(
      { clerk_user_id: userId, email, ...update, updated_at: new Date().toISOString() },
      { onConflict: 'clerk_user_id' },
    )
    .select(
      'clerk_user_id, email, full_name, company_name, license_number, phone, contact_email, logo_url, headshot_url, updated_at',
    )
    .single();

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
    .select('clerk_user_id, email, cluster, access_status, created_at, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: data });
}
