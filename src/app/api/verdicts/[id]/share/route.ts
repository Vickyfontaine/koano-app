// GET /api/verdicts/[id]/share → { url } for the owner of the verdict (UI
// sprint WS5). The link opens the sealed record at /v/[id] without an account.

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../../../../../lib/supabase/server';
import { sharePath } from '../../../../../../lib/share';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = params.id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid verdict id' }, { status: 400 });
  const { data, error } = await supabaseAdmin().from('verdicts').select('id, clerk_user_id').eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.clerk_user_id !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  let path: string;
  try {
    path = sharePath(id);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Share links are not configured' }, { status: 500 });
  }
  const origin = new URL(req.url).origin;
  return NextResponse.json({ url: `${origin}${path}`, path });
}
