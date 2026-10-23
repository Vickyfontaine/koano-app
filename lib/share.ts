// Share links for sealed verdict records (UI sprint WS5). A link is the
// verdict id plus an HMAC of it under a server secret, so a page can be shared
// without an account and without a schema change; nobody can mint a link
// without the secret, and a link reveals only the one record it names.

import { createHmac, timingSafeEqual } from 'node:crypto';

function secret(): string {
  const s = process.env.KOANO_SHARE_SECRET ?? process.env.CRON_SECRET ?? '';
  if (!s) throw new Error('KOANO_SHARE_SECRET (or CRON_SECRET) must be set to sign share links');
  return s;
}

export function shareToken(verdictId: string): string {
  return createHmac('sha256', secret()).update(`verdict:${verdictId}`).digest('hex').slice(0, 32);
}

export function verifyShareToken(verdictId: string, token: string | null | undefined): boolean {
  if (!token || token.length !== 32) return false;
  try {
    const a = Buffer.from(shareToken(verdictId), 'utf8');
    const b = Buffer.from(token, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function sharePath(verdictId: string): string {
  return `/v/${verdictId}?t=${shareToken(verdictId)}`;
}
