/* POST /api/contact: the contact form's only server code. Runs on demand (not prerendered) on Vercel.
   It checks the submission, then sends two emails through Resend: the enquiry to Oluwayemi (reply-to the
   visitor) and a confirmation to the visitor (reply-to Oluwayemi).
   Secrets live only in environment variables, never in the repo:
     RESEND_API_KEY   the Resend key (sending access, yemmy.design domain)
     CONTACT_TO       where enquiries land (defaults to hello@yemmy.design)
     CONTACT_FROM     the verified sender (defaults to "Oluwayemi Akinbande <hello@yemmy.design>")
   Spam defences, all quiet: a hidden field bots fill in, a minimum time on the page, and hard size limits. */
import type { APIRoute } from 'astro';
import { ownerEmail, confirmEmail } from '../../lib/contact-email.mjs';
import { AVATAR_CID, AVATAR_PNG_BASE64 } from '../../lib/email-avatar.mjs';
import { social } from '../../config';

export const prerender = false;

const env = (k: string) => (typeof process !== 'undefined' ? process.env[k] : undefined) ?? (import.meta.env as Record<string, string | undefined>)[k];
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const EMAIL = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:"]{2,}$/;
const clean = (v: unknown, max: number) => String(v ?? '').replace(/\u0000/g, '').trim().slice(0, max);

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try { body = await request.json(); } catch { return json(400, { ok: false, error: 'bad-request' }); }

  // a bot filled the hidden field, or the form was sent faster than a person can fill it: pretend it worked
  if (clean(body?._gotcha, 200) || Number(body?._t) < 2500) return json(200, { ok: true });

  const name = clean(body?.name, 120), email = clean(body?.email, 200), company = clean(body?.company, 160);
  const intent = clean(body?.intent, 60) || 'A message';
  const rows: [string, string][] = Array.isArray(body?.rows)
    ? body.rows.slice(0, 30)
        .filter((r: unknown) => Array.isArray(r) && r.length === 2)
        .map(([k, v]: [unknown, unknown]) => [clean(k, 40), clean(v, String(k) === 'Message' ? 5000 : 800)] as [string, string])
        .filter(([k, v]: [string, string]) => k && v)
    : [];
  if (!name || !EMAIL.test(email) || rows.length === 0) return json(422, { ok: false, error: 'invalid' });

  const key = env('RESEND_API_KEY');
  if (!key) return json(503, { ok: false, error: 'not-configured' });
  const to = env('CONTACT_TO') || 'hello@yemmy.design';
  const from = env('CONTACT_FROM') || 'Oluwayemi Akinbande <hello@yemmy.design>';
  const site = { url: 'https://yemmy.design/', host: 'yemmy.design', linkedin: social.linkedin };

  const owner = ownerEmail({ intent, name, email, company, rows, site });
  const confirm = confirmEmail({ intent, name, email, rows, site });
  // his round photo travels inside each email as an inline attachment, so the header never depends on a web image.
  // Resend's batch endpoint does not take attachments, so the two emails go as two calls, side by side.
  const avatar = [{ filename: 'oluwayemi.png', content: AVATAR_PNG_BASE64, content_id: AVATAR_CID }];
  const send = (mail: Record<string, unknown>) => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...mail, attachments: avatar }),
  });
  try {
    const [a, b] = await Promise.all([
      send({ from, to: [to], reply_to: email, subject: owner.subject, html: owner.html, text: owner.text }),
      send({ from, to: [email], reply_to: to, subject: confirm.subject, html: confirm.html, text: confirm.text }),
    ]);
    if (!a.ok || !b.ok) {
      for (const r of [a, b]) if (!r.ok) console.error('resend', r.status, await r.text().catch(() => ''));
      // the enquiry reaching him is what matters; a failed confirmation alone still counts as sent
      if (!a.ok) return json(502, { ok: false, error: 'send-failed' });
    }
    return json(200, { ok: true });
  } catch (e) {
    console.error('resend', e);
    return json(502, { ok: false, error: 'send-failed' });
  }
};

// anything but POST
export const ALL: APIRoute = () => json(405, { ok: false, error: 'method-not-allowed' });
