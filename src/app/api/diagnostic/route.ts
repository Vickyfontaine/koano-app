// TEMPORARY diagnostic route — DELETE after use.
// Reports Clerk auth + env configuration to pin down the production login
// bounce. SECURITY: never emits full secrets. The secret key is reported as
// its prefix only (e.g. "sk_live" / "sk_test"); the publishable key is public
// by design (NEXT_PUBLIC_*) but is also reduced to prefix + instance domain.
// Token-gated so it is not wide open while it exists.
//
// Hit it in a browser where you are logged in, so the Clerk session cookie is
// sent and auth() can resolve your userId:
//   https://koano.co/api/diagnostic?token=koano-diag-2026

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

const TOKEN = 'koano-diag-2026';

// pk_test_<base64("fapi-domain$")> → the Clerk instance the client/server talk to
function instanceDomainFromPk(pk: string | undefined): string | null {
  if (!pk) return null;
  const body = pk.replace(/^pk_(test|live)_/, '');
  try {
    const decoded = Buffer.from(body, 'base64').toString('utf8');
    return decoded.replace(/\$+$/, '') || null;
  } catch {
    return null;
  }
}

// First two underscore-delimited segments only, e.g. "pk_live", "sk_test".
function prefixOnly(key: string | undefined): string | null {
  if (!key) return null;
  const parts = key.split('_');
  return parts.length >= 2 ? `${parts[0]}_${parts[1]}` : parts[0];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get('token') !== TOKEN) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let userId: string | null = null;
  let authError: string | null = null;
  try {
    const a = await auth();
    userId = a.userId;
  } catch (e) {
    authError = e instanceof Error ? e.message : String(e);
  }

  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const sk = process.env.CLERK_SECRET_KEY;
  const pkPrefix = prefixOnly(pk); // pk_live | pk_test
  const skPrefix = prefixOnly(sk); // sk_live | sk_test

  // The load-bearing check: do client and server keys agree on environment?
  const pkEnv = pkPrefix?.split('_')[1] ?? null; // live | test
  const skEnv = skPrefix?.split('_')[1] ?? null;

  return NextResponse.json({
    note: 'TEMPORARY diagnostic — delete after use. No full secrets are emitted.',
    auth: {
      authenticated: !!userId,
      userId, // the requester's own id; safe to show to the requester
      authError,
    },
    clerk: {
      publishable_key_prefix: pkPrefix,
      secret_key_prefix: skPrefix,
      instance_domain: instanceDomainFromPk(pk),
      keys_match_environment: pkEnv !== null && skEnv !== null && pkEnv === skEnv,
    },
    app_urls: {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? null,
      NEXT_PUBLIC_MARKETING_URL: process.env.NEXT_PUBLIC_MARKETING_URL ?? null,
    },
  });
}
