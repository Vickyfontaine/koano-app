// KOANO monitoring — the weekly email digest. Sent Monday morning (shard 0),
// after that day's monitoring runs, covering all still-pending notifications from
// the week. One email per user (the in-app feed carries same-day immediacy; the
// email is the weekly nudge). Uses Resend's HTTP API (same as the archive alert).
//
// Every line is a notification the deterministic diff engine already produced —
// the digest only groups and formats. No new claims are introduced here.

import type { SupabaseClient } from '@supabase/supabase-js';

export interface DigestNotification {
  property_id: string;
  signal_type: string;
  severity: 'info' | 'material' | 'high';
  title: string;
  body: string;
  link_path: string | null;
  data: Record<string, unknown>;
}

const SEV_RANK: Record<string, number> = { info: 0, material: 1, high: 2 };
const SEV_COLOR: Record<string, string> = { high: '#EF4444', material: '#F59E0B', info: '#22C55E' };

// NEXT_PUBLIC_APP_URL resolves to http://localhost:3001 in .env.local and has
// been unreliable in prod (the same class of bug that broke login). Default to
// the production origin and ONLY override with the env value when it is a real
// https, non-localhost URL — so a digest can never build dead localhost links.
export function productionAppUrl(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  return env && /^https:\/\//i.test(env) && !/localhost|127\.0\.0\.1/i.test(env) ? env : 'https://www.koano.co';
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function windowLine(data: Record<string, unknown>): string {
  const from = data.window_from as string | undefined;
  const to = data.window_to as string | undefined;
  return from && to ? `Compared: ${from} → ${to}` : '';
}

export interface AddressedGroup { address: string; items: DigestNotification[] }

// Pure render → { subject, html, text }. Returns null if there is nothing to send.
export function buildDigest(groups: AddressedGroup[], appUrl: string): { subject: string; html: string; text: string } | null {
  const link = (p: string | null) => (p ? `${appUrl}${p}` : appUrl);

  // Split each group's change line items from the verdict-data-change, which
  // becomes a CLOSING call-to-action, not a repeated 6th line.
  const prepared = groups
    .map((g) => ({
      address: g.address,
      lines: g.items.filter((i) => i.signal_type !== 'verdict_data_change'),
      cta: g.items.find((i) => i.signal_type === 'verdict_data_change') ?? null,
    }))
    .filter((g) => g.lines.length > 0);

  const total = prepared.reduce((n, g) => n + g.lines.length, 0);
  if (total === 0) return null;

  const subject = `KOANO — ${total} ${total === 1 ? 'change' : 'changes'} across your watched ${prepared.length === 1 ? 'property' : 'properties'}`;

  const htmlGroups = prepared
    .map((g) => {
      const addrLink = g.lines[0]?.link_path ? link(g.lines[0].link_path) : appUrl;
      const rows = g.lines
        .map((n) => `
        <div style="margin-top:12px;padding-left:12px;border-left:3px solid ${SEV_COLOR[n.severity]};">
          <div style="font-size:14px;font-weight:500;color:#0D2B3E;">${esc(n.title)}</div>
          <div style="font-size:13px;color:#3D5A6E;line-height:1.5;margin-top:2px;">${esc(n.body)}</div>
          ${windowLine(n.data) ? `<div style="font-size:11px;color:#8AABB8;margin-top:4px;font-family:monospace;">${esc(windowLine(n.data))}</div>` : ''}
        </div>`)
        .join('');
      let cta = '';
      if (g.cta) {
        const verdict = String((g.cta.data as { verdict?: string }).verdict ?? '').toUpperCase();
        const affected = g.lines.filter((n) => n.severity !== 'info').length;
        cta = `
        <div style="margin-top:14px;padding:12px 14px;background:#F0F7FC;border-radius:8px;">
          <span style="font-size:13px;color:#1A4F6E;">${affected} of these change${affected === 1 ? '' : 's'} affect your stored ${esc(verdict)} verdict.</span>
          <a href="${link(g.cta.link_path)}" style="font-size:13px;font-weight:600;color:#5A9BBE;text-decoration:none;"> Re-run to see if it holds →</a>
        </div>`;
      }
      return `
      <div style="margin:20px 0;border:1px solid #D6EBF7;border-radius:12px;padding:16px;">
        <a href="${addrLink}" style="font-size:15px;font-weight:600;color:#0D2B3E;text-decoration:none;">${esc(g.address)}</a>${rows}${cta}
      </div>`;
    })
    .join('');

  const html = `<!doctype html><html><body style="margin:0;background:#F0F7FC;padding:24px;">
    <div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:16px;padding:28px;">
      <div style="padding-bottom:16px;border-bottom:2px solid #A8C4D4;">
        <span style="font-size:20px;font-weight:700;letter-spacing:-0.02em;color:#0D2B3E;">KOANO</span>
        <span style="font-size:10px;color:#5A7A8C;letter-spacing:1.5px;text-transform:uppercase;margin-left:8px;">Weekly monitoring</span>
      </div>
      <p style="font-size:15px;color:#3D5A6E;margin:16px 0 0;">${total} ${total === 1 ? 'change' : 'changes'} on the ${prepared.length === 1 ? 'property' : 'properties'} you monitor. Every item is a factual before/after read from the public record.</p>
      ${htmlGroups}
      <p style="font-size:11px;color:#8AABB8;border-top:1px solid #E8F3FA;padding-top:16px;margin-top:8px;line-height:1.5;">
        You receive this because you monitor these properties in KOANO. Manage what you watch and how you're notified in your dashboard settings.
        This is decision-support, not decision-making; every figure traces to a public source and the comparison window is shown.
      </p>
    </div>
  </body></html>`;

  const text = [
    'KOANO — Weekly monitoring',
    `${total} ${total === 1 ? 'change' : 'changes'} on the ${prepared.length === 1 ? 'property' : 'properties'} you monitor.`,
    '',
    ...prepared.flatMap((g) => {
      const lines = [
        g.address,
        g.lines[0]?.link_path ? `  ${link(g.lines[0].link_path)}` : '',
        ...g.lines.map((n) => {
          const w = windowLine(n.data);
          return `  [${n.severity.toUpperCase()}] ${n.title}\n    ${n.body}${w ? `\n    ${w}` : ''}`;
        }),
      ];
      if (g.cta) {
        const verdict = String((g.cta.data as { verdict?: string }).verdict ?? '').toUpperCase();
        const affected = g.lines.filter((n) => n.severity !== 'info').length;
        lines.push(`  → ${affected} of these change${affected === 1 ? '' : 's'} affect your stored ${verdict} verdict. Re-run to see if it holds: ${link(g.cta.link_path)}`);
      }
      lines.push('');
      return lines;
    }),
    'You receive this because you monitor these properties in KOANO. Decision-support, not decision-making.',
  ].filter((l) => l !== undefined).join('\n');

  return { subject, html, text };
}

async function resendSend(from: string, to: string, subject: string, html: string, text: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.error('[digest] RESEND_API_KEY not set'); return false; }
  // Hard guard: never send a digest whose links point at localhost.
  if (/localhost|127\.0\.0\.1/i.test(html) || /localhost|127\.0\.0\.1/i.test(text)) {
    console.error('[digest] REFUSING to send — links resolve to localhost (set NEXT_PUBLIC_APP_URL to the prod origin)');
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html, text }),
  });
  if (!res.ok) { console.error(`[digest] Resend failed (${res.status}): ${await res.text()}`); return false; }
  return true;
}

// Send the weekly digest to every user with pending notifications, respecting
// their preferences. Marks sent notifications so a re-run doesn't re-send.
export async function sendWeeklyDigests(admin: SupabaseClient): Promise<{ usersEmailed: number; notificationsSent: number }> {
  const from = process.env.MONITORING_EMAIL_FROM;
  const appUrl = productionAppUrl();
  if (!from) { console.error('[digest] MONITORING_EMAIL_FROM not set — skipping digests'); return { usersEmailed: 0, notificationsSent: 0 }; }

  const { data: pending } = await admin
    .from('notifications')
    .select('id, clerk_user_id, property_id, signal_type, severity, title, body, link_path, data')
    .eq('email_status', 'pending');
  if (!pending || pending.length === 0) return { usersEmailed: 0, notificationsSent: 0 };

  const byUser = new Map<string, typeof pending>();
  for (const n of pending) {
    const arr = byUser.get(n.clerk_user_id as string) ?? [];
    arr.push(n);
    byUser.set(n.clerk_user_id as string, arr);
  }

  let usersEmailed = 0;
  let notificationsSent = 0;

  for (const [userId, notifs] of Array.from(byUser.entries())) {
    const { data: pref } = await admin
      .from('monitoring_preferences')
      .select('email_enabled, frequency, muted_signal_types, min_severity')
      .eq('clerk_user_id', userId)
      .maybeSingle();
    const emailEnabled = pref?.email_enabled ?? true;
    const frequency = (pref?.frequency as string) ?? 'weekly';
    const muted = new Set((pref?.muted_signal_types as string[]) ?? []);
    const minSev = SEV_RANK[(pref?.min_severity as string) ?? 'material'];

    // verdict_data_change always rides along with the material changes it summarizes.
    const kept = notifs.filter(
      (n) => n.signal_type === 'verdict_data_change' || (!muted.has(n.signal_type as string) && SEV_RANK[n.severity as string] >= minSev),
    );

    if (!emailEnabled || frequency === 'off' || kept.filter((n) => n.signal_type !== 'verdict_data_change').length === 0) {
      await admin.from('notifications').update({ email_status: 'skipped' }).in('id', notifs.map((n) => n.id));
      continue;
    }

    const { data: profile } = await admin.from('profiles').select('email').eq('clerk_user_id', userId).maybeSingle();
    const to = profile?.email as string | undefined;
    if (!to) { console.error(`[digest] no email for ${userId} — leaving pending`); continue; }

    const propIds = Array.from(new Set(kept.map((n) => n.property_id as string)));
    const { data: props } = await admin.from('properties').select('id, address_normalized, address_input').in('id', propIds);
    const addr = new Map((props ?? []).map((p) => [p.id as string, (p.address_normalized as string) || (p.address_input as string)]));

    const groups: AddressedGroup[] = propIds.map((pid) => ({
      address: addr.get(pid) ?? 'Property',
      items: kept.filter((n) => n.property_id === pid).map((n) => ({
        property_id: n.property_id as string, signal_type: n.signal_type as string, severity: n.severity as DigestNotification['severity'],
        title: n.title as string, body: n.body as string, link_path: n.link_path as string | null, data: (n.data as Record<string, unknown>) ?? {},
      })),
    }));

    const digest = buildDigest(groups, appUrl);
    if (!digest) continue;
    const okSend = await resendSend(from, to, digest.subject, digest.html, digest.text);
    if (okSend) {
      await admin.from('notifications').update({ email_status: 'sent', channels_sent: ['email'] }).in('id', kept.map((n) => n.id));
      usersEmailed += 1;
      notificationsSent += kept.filter((n) => n.signal_type !== 'verdict_data_change').length;
    }
  }

  return { usersEmailed, notificationsSent };
}
