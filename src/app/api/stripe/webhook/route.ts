// KOANO Stripe webhook — Phase 3 (test mode). NOT Clerk-protected (Stripe
// calls it); the Stripe signature is verified instead. Node runtime, raw body.
// Writes profiles.plan (the guard's entitlement field) from subscription
// lifecycle. Matching is by STORED stripe_customer_id, never by email; the
// initial purchase binds via the session's client_reference_id (clerk_user_id).
//
// Plan policy (confirmed): past_due KEEPS the paid tier (Stripe is retrying).
// Downgrade to free only on true termination — canceled / unpaid /
// incomplete_expired, or subscription.deleted.
//
// Idempotent: every write sets absolute values, safe on Stripe redelivery.

import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe, PRICE_TO_TIER, isPaidTier, type PaidTier } from '../../../../../lib/stripe/client';
import { supabaseAdmin } from '../../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Statuses that retain the paid tier (past_due keeps entitlement during retries).
const ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>(['active', 'trialing', 'past_due']);
// Terminal statuses → downgrade to free.
const TERMINAL_STATUSES = new Set<Stripe.Subscription.Status>([
  'canceled',
  'unpaid',
  'incomplete_expired',
]);

function customerIdOf(customer: string | Stripe.Customer | Stripe.DeletedCustomer): string {
  return typeof customer === 'string' ? customer : customer.id;
}

function tierFromSubscription(sub: Stripe.Subscription): PaidTier | null {
  const priceId = sub.items.data[0]?.price?.id;
  if (priceId && PRICE_TO_TIER[priceId]) return PRICE_TO_TIER[priceId];
  return isPaidTier(sub.metadata?.tier) ? (sub.metadata.tier as PaidTier) : null;
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'webhook secret not configured' }, { status: 500 });
  }
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'missing stripe-signature' }, { status: 400 });
  }

  // Raw body is required for signature verification — never parse JSON first.
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    return NextResponse.json(
      { error: `signature verification failed: ${e instanceof Error ? e.message : String(e)}` },
      { status: 400 },
    );
  }

  const sb = supabaseAdmin();
  const now = () => new Date().toISOString();

  try {
    switch (event.type) {
      // Bind the purchase to the user by client_reference_id (clerk_user_id),
      // store the customer + subscription ids, and set the paid plan.
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        const clerkUserId =
          s.client_reference_id ?? (s.metadata?.clerk_user_id as string | undefined) ?? null;
        const tier = isPaidTier(s.metadata?.tier) ? (s.metadata!.tier as PaidTier) : null;
        if (clerkUserId && tier) {
          await sb
            .from('profiles')
            .update({
              stripe_customer_id: s.customer ? customerIdOf(s.customer) : null,
              stripe_subscription_id:
                typeof s.subscription === 'string' ? s.subscription : (s.subscription?.id ?? null),
              subscription_status: 'active',
              plan: tier,
              updated_at: now(),
            })
            .eq('clerk_user_id', clerkUserId);
        } else {
          console.warn('[stripe-webhook] checkout.session.completed missing user/tier', s.id);
        }
        break;
      }

      // Match by stored stripe_customer_id. Keep paid tier through past_due;
      // downgrade to free only on terminal statuses.
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = customerIdOf(sub.customer);
        const tier = tierFromSubscription(sub);
        if (ACTIVE_STATUSES.has(sub.status) && tier) {
          await sb
            .from('profiles')
            .update({
              plan: tier,
              subscription_status: sub.status,
              stripe_subscription_id: sub.id,
              updated_at: now(),
            })
            .eq('stripe_customer_id', customerId);
        } else if (TERMINAL_STATUSES.has(sub.status)) {
          await sb
            .from('profiles')
            .update({ plan: 'free', subscription_status: sub.status, updated_at: now() })
            .eq('stripe_customer_id', customerId);
        } else {
          // e.g. 'incomplete' — record status, do not change entitlement yet.
          await sb
            .from('profiles')
            .update({ subscription_status: sub.status, updated_at: now() })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      // Subscription ended → free.
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = customerIdOf(sub.customer);
        await sb
          .from('profiles')
          .update({
            plan: 'free',
            subscription_status: 'canceled',
            stripe_subscription_id: null,
            updated_at: now(),
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      // No entitlement change here — the resulting subscription.updated
      // (past_due) drives policy. Logged so the event isn't "unhandled".
      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice;
        console.log('[stripe-webhook] invoice.payment_failed', inv.id);
        break;
      }

      default:
        // Acknowledge unhandled event types so Stripe stops retrying them.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    // 500 → Stripe retries, which is correct for a transient DB write failure.
    console.error('[stripe-webhook] handler error:', e);
    return NextResponse.json({ error: 'handler error' }, { status: 500 });
  }
}
