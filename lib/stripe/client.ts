// Stripe client + tier↔price maps. Server-side only (uses the secret key).
// The four price IDs are the live test-mode prices for the paid KOANO plans;
// 'free' has no price. plan (profiles.plan) is the entitlement the guard
// reads — the webhook derives it from the subscription's price id here.

import Stripe from 'stripe';

let _stripe: Stripe | null = null;
export function stripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export type PaidTier = 'community' | 'transaction' | 'development' | 'portfolio';

export const TIER_TO_PRICE: Record<PaidTier, string> = {
  community: 'price_1U1b07Bo5UJeLc11eggNaSnR', // $19
  transaction: 'price_1U1b3ZBo5UJeLc11RzY1btbc', // $149
  development: 'price_1U1b4gBo5UJeLc1119V2sCYa', // $499
  portfolio: 'price_1U1b1XBo5UJeLc11taofHNLz', // $1,499
};

// Reverse map — the webhook trusts the subscription's price id as the source
// of truth for which tier was purchased.
export const PRICE_TO_TIER: Record<string, PaidTier> = Object.fromEntries(
  Object.entries(TIER_TO_PRICE).map(([tier, price]) => [price, tier]),
) as Record<string, PaidTier>;

export const PAID_TIERS = Object.keys(TIER_TO_PRICE) as PaidTier[];

export function isPaidTier(value: unknown): value is PaidTier {
  return typeof value === 'string' && (PAID_TIERS as string[]).includes(value);
}
