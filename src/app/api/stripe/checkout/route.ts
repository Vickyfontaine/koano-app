// KOANO Stripe Checkout — Phase 3 (test mode). Clerk-protected.
// POST { tier } → ensures a Stripe customer bound to this KOANO user (created
// with metadata.clerk_user_id and stored on the profile), creates a
// subscription Checkout Session for the tier's price, and returns { url } for
// the client to redirect to. The session carries client_reference_id and
// metadata.clerk_user_id so the webhook binds the purchase to the user by id,
// never by email.

import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { stripe, TIER_TO_PRICE, isPaidTier } from '../../../../../lib/stripe/client';
import { supabaseAdmin } from '../../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { tier?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!isPaidTier(body.tier)) {
    return NextResponse.json(
      { error: '"tier" must be one of community, transaction, development, portfolio' },
      { status: 400 },
    );
  }
  const tier = body.tier;

  const sb = supabaseAdmin();
  const { data: profile, error } = await sb
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('clerk_user_id', userId)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const user = await currentUser();
  const email =
    (profile?.email as string | undefined) ??
    user?.primaryEmailAddress?.emailAddress ??
    undefined;

  // Ensure exactly one Stripe customer per KOANO user. Store the id on the
  // profile immediately so the link exists even if checkout is abandoned.
  let customerId = profile?.stripe_customer_id as string | null | undefined;
  if (!customerId) {
    const customer = await stripe().customers.create({
      email,
      metadata: { clerk_user_id: userId },
    });
    customerId = customer.id;
    await sb
      .from('profiles')
      .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
      .eq('clerk_user_id', userId);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';

  try {
    const session = await stripe().checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: TIER_TO_PRICE[tier], quantity: 1 }],
      client_reference_id: userId,
      metadata: { clerk_user_id: userId, tier },
      subscription_data: { metadata: { clerk_user_id: userId, tier } },
      success_url: `${appUrl}/dashboard?upgraded=1`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'checkout session failed' },
      { status: 502 },
    );
  }
}
