// KOANO profile asset API — white-label logo / headshot upload.
// POST   (multipart: file, kind=logo|headshot) → uploads to the profile-assets
//        bucket at {clerk_user_id}/{kind} via the service role, stores the
//        public URL on the profile, returns { url }.
// DELETE ({ kind }) → removes the object and clears the profile field.
// Clerk-protected; runtime nodejs (file handling). Server-proxied uploads keep
// this consistent with every other privileged write (Clerk auth, service role).

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const BUCKET = 'profile-assets';
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);
const KINDS = new Set(['logo', 'headshot']);

function columnFor(kind: string): 'logo_url' | 'headshot_url' {
  return kind === 'logo' ? 'logo_url' : 'headshot_url';
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const kind = String(form.get('kind') ?? '');
  if (!KINDS.has(kind)) {
    return NextResponse.json({ error: '"kind" must be "logo" or "headshot"' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: '"file" is required' }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported type "${file.type || 'unknown'}". Allowed: PNG, JPEG, WebP.` },
      { status: 415 },
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File exceeds the 2 MB limit' }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const path = `${userId}/${kind}`; // owner-scoped folder (matches the RLS policy)
  const sb = supabaseAdmin();

  const up = await sb.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: true, // replace an existing logo/headshot in place
  });
  if (up.error) {
    return NextResponse.json({ error: `Upload failed: ${up.error.message}` }, { status: 502 });
  }

  // Public bucket → stable public URL; cache-bust so a replacement shows at once.
  const publicUrl = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const url = `${publicUrl}?v=${Date.now()}`;

  const upd = await sb
    .from('profiles')
    .upsert(
      { clerk_user_id: userId, [columnFor(kind)]: url, updated_at: new Date().toISOString() },
      { onConflict: 'clerk_user_id' },
    )
    .select(`clerk_user_id, ${columnFor(kind)}`)
    .single();
  if (upd.error) {
    return NextResponse.json({ error: upd.error.message }, { status: 500 });
  }

  return NextResponse.json({ kind, url });
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { kind?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const kind = String(body.kind ?? '');
  if (!KINDS.has(kind)) {
    return NextResponse.json({ error: '"kind" must be "logo" or "headshot"' }, { status: 400 });
  }

  const sb = supabaseAdmin();
  // Remove the object (ignore "not found" — the goal is that it's gone).
  const rm = await sb.storage.from(BUCKET).remove([`${userId}/${kind}`]);
  if (rm.error) {
    return NextResponse.json({ error: `Delete failed: ${rm.error.message}` }, { status: 502 });
  }

  const upd = await sb
    .from('profiles')
    .update({ [columnFor(kind)]: null, updated_at: new Date().toISOString() })
    .eq('clerk_user_id', userId)
    .select(`clerk_user_id, ${columnFor(kind)}`)
    .single();
  if (upd.error) {
    return NextResponse.json({ error: upd.error.message }, { status: 500 });
  }

  return NextResponse.json({ kind, url: null });
}
