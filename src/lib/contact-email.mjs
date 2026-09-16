/* The two emails the contact form sends through Resend.
   1. To Oluwayemi: every answer in a clean table, the message set apart, and a one-tap reply.
   2. To the visitor: a confirmation that it arrived, a receipt of what they sent, and what happens next.
   Email clients are old: layout is tables, every style is inline, widths are fixed at 600px with a small media query
   for phones, and nothing depends on images loading. Plain JavaScript on purpose, so the same file renders in the
   API route and in a local preview script. Every value from the form is escaped before it touches the HTML. */

const C = {
  page: '#EEF0F4', card: '#FFFFFF', line: '#E4E7ED', rule: '#EDF0F4', tint: '#F7F8FA',
  ink: '#0B0C10', text: '#12151C', body: '#4A5060', label: '#6B7280', faint: '#8A90A0',
  brand: '#3B6FEB', brandDark: '#2552BA', brandSoft: '#EEF3FF', dot: '#6190FF', ok: '#16A36A',
};
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace";

export const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const para = (s) => esc(s).replace(/\r?\n/g, '<br>');
const first = (name) => String(name || '').trim().split(/\s+/)[0] || 'there';

/* the frame both emails share: a dark header with the wordmark, a blue rule, the white card, a quiet footer */
function frame({ preheader, tag, inner, footer }) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light">
<title>yemmy.design</title>
<style>
  @media (max-width: 620px) {
    .wrap { padding: 0 !important; }
    .card { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; border-left: 0 !important; border-right: 0 !important; }
    .pad { padding-left: 24px !important; padding-right: 24px !important; }
    .kv td { display: block !important; width: auto !important; }
    .kv .k { padding: 12px 16px 2px !important; border-bottom: 0 !important; background: ${C.card} !important; }
    .kv .v { padding: 0 16px 12px !important; }
    .h1 { font-size: 23px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.page};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.page};">${esc(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page};">
<tr><td class="wrap" align="center" style="padding:32px 16px;">
  <table role="presentation" class="card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:${C.card};border:1px solid ${C.line};border-radius:16px;overflow:hidden;">
    <tr><td class="pad" style="background:${C.ink};padding:26px 36px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="font-family:${SANS};font-size:21px;font-weight:700;letter-spacing:-0.5px;color:#FFFFFF;">yemmy<span style="color:${C.dot};">.</span></td>
        <td align="right" style="font-family:${MONO};font-size:10.5px;letter-spacing:1.6px;text-transform:uppercase;color:#9AA3B5;">${esc(tag)}</td>
      </tr></table>
    </td></tr>
    <tr><td style="height:3px;line-height:3px;font-size:0;background:${C.brand};">&nbsp;</td></tr>
    ${inner}
    <tr><td class="pad" style="padding:22px 36px 26px;border-top:1px solid ${C.rule};font-family:${SANS};font-size:12px;line-height:1.6;color:${C.faint};">${footer}</td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}

/* the answers, as a two-column table: a tinted label column in small capitals, the answer beside it */
function answers(rows) {
  const body = rows.map(([k, v], i) => {
    const last = i === rows.length - 1;
    const edge = last ? '' : `border-bottom:1px solid ${C.rule};`;
    return `<tr>
      <td class="k" width="34%" valign="top" style="width:34%;padding:16px 16px 13px;background:${C.tint};${edge}font-family:${MONO};font-size:10.5px;line-height:1.5;letter-spacing:1.1px;text-transform:uppercase;color:${C.label};">${esc(k)}</td>
      <td class="v" valign="top" style="padding:13px 16px;${edge}font-family:${SANS};font-size:14.5px;line-height:1.55;color:${C.text};">${para(v)}</td>
    </tr>`;
  }).join('');
  return `<table role="presentation" class="kv" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${C.line};border-radius:12px;border-collapse:separate;overflow:hidden;">${body}</table>`;
}

function messageBlock(title, text) {
  if (!text) return '';
  return `<tr><td class="pad" style="padding:0 36px 8px;">
    <p style="margin:26px 0 10px;font-family:${MONO};font-size:10.5px;letter-spacing:1.4px;text-transform:uppercase;color:${C.label};">${esc(title)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="width:3px;background:${C.brand};border-radius:3px;"></td>
      <td style="padding:16px 18px;background:${C.tint};border-radius:0 10px 10px 0;font-family:${SANS};font-size:15px;line-height:1.65;color:${C.text};">${para(text)}</td>
    </tr></table>
  </td></tr>`;
}

const pill = (text) => `<span style="display:inline-block;padding:5px 11px;border-radius:999px;background:${C.brandSoft};font-family:${MONO};font-size:10.5px;letter-spacing:1.2px;text-transform:uppercase;color:${C.brandDark};">${esc(text)}</span>`;
const button = (href, label, dark = true) => `<a href="${esc(href)}" style="display:inline-block;padding:13px 22px;border-radius:10px;background:${dark ? C.ink : C.card};border:1px solid ${dark ? C.ink : C.line};font-family:${SANS};font-size:14px;font-weight:600;color:${dark ? '#FFFFFF' : C.text};text-decoration:none;">${label}</a>`;

/* split the answers: the message gets its own block, everything else goes in the table */
function split(rows) {
  const msg = rows.find(([k]) => k === 'Message');
  return { table: rows.filter(([k]) => k !== 'Message'), message: msg ? msg[1] : '' };
}

/* 1. to Oluwayemi */
export function ownerEmail({ intent, name, email, company, rows, site }) {
  const { table, message } = split(rows);
  const who = `${name}${company ? ` at ${company}` : ''}`;
  const replyHref = `mailto:${email}?subject=${encodeURIComponent(`Re: ${intent}`)}`;
  const inner = `
    <tr><td class="pad" style="padding:34px 36px 6px;">
      ${pill(intent)}
      <h1 class="h1" style="margin:16px 0 8px;font-family:${SANS};font-size:26px;line-height:1.25;letter-spacing:-0.6px;font-weight:700;color:${C.text};">New enquiry from ${esc(who)}</h1>
      <p style="margin:0 0 24px;font-family:${SANS};font-size:15px;line-height:1.6;color:${C.body};">Sent from the contact form on ${esc(site.host)}. Replying to this email goes straight to ${esc(first(name))}.</p>
      ${answers(table)}
    </td></tr>
    ${messageBlock('Their message', message)}
    <tr><td class="pad" style="padding:26px 36px 34px;">
      ${button(replyHref, `Reply to ${esc(first(name))}`)}
      <span style="display:inline-block;width:8px;"></span>
      <span style="display:inline-block;font-family:${SANS};font-size:13px;color:${C.label};vertical-align:middle;">${esc(email)}</span>
    </td></tr>`;
  const footer = `This came from the contact form on <a href="${esc(site.url)}" style="color:${C.label};">${esc(site.host)}</a>. The sender also received a confirmation copy.`;
  return {
    subject: `${intent}: ${who}`,
    html: frame({ preheader: `${who} · ${message ? message.slice(0, 90) : intent}`, tag: 'New enquiry', inner, footer }),
    text: [`New enquiry: ${intent}`, `From: ${who} <${email}>`, '', ...table.map(([k, v]) => `${k}: ${v}`), ...(message ? ['', 'Message:', message] : []), '', `Reply to this email to answer ${first(name)}.`].join('\n'),
  };
}

/* 2. to the visitor */
export function confirmEmail({ intent, name, email, rows, site }) {
  const { table, message } = split(rows);
  const steps = [
    ['Your message is with me', 'It comes straight to my inbox, not a shared queue.'],
    ['I reply by email', `My answer will come to ${email}.`],
    ["If it's a fit, we set up a call", 'We talk it through and agree the next step together.'],
  ];
  const stepRows = steps.map(([t, d], i) => `<tr>
      <td width="40" valign="top" style="width:40px;padding:0 0 16px;">
        <div style="width:28px;height:28px;border-radius:999px;background:${i === 0 ? C.ok : C.brandSoft};text-align:center;line-height:28px;font-family:${MONO};font-size:12px;font-weight:600;color:${i === 0 ? '#FFFFFF' : C.brandDark};">${i === 0 ? '&#10003;' : i + 1}</div>
      </td>
      <td valign="top" style="padding:3px 0 16px;font-family:${SANS};">
        <div style="font-size:15px;font-weight:600;color:${C.text};">${esc(t)}</div>
        <div style="margin-top:2px;font-size:14px;line-height:1.55;color:${C.body};">${esc(d)}</div>
      </td>
    </tr>`).join('');
  const inner = `
    <tr><td class="pad" style="padding:34px 36px 4px;">
      ${pill('Message received')}
      <h1 class="h1" style="margin:16px 0 10px;font-family:${SANS};font-size:26px;line-height:1.25;letter-spacing:-0.6px;font-weight:700;color:${C.text};">Thank you, ${esc(first(name))}. Your message is with me.</h1>
      <p style="margin:0;font-family:${SANS};font-size:15.5px;line-height:1.65;color:${C.body};">I read every enquiry myself and reply personally by email. Here is a copy of what you sent, so you have it for your records.</p>
    </td></tr>
    <tr><td class="pad" style="padding:28px 36px 0;">
      <p style="margin:0 0 10px;font-family:${MONO};font-size:10.5px;letter-spacing:1.4px;text-transform:uppercase;color:${C.label};">What you sent</p>
      ${answers(table)}
    </td></tr>
    ${messageBlock('Your message', message)}
    <tr><td class="pad" style="padding:30px 36px 6px;">
      <p style="margin:0 0 16px;font-family:${MONO};font-size:10.5px;letter-spacing:1.4px;text-transform:uppercase;color:${C.label};">What happens next</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${stepRows}</table>
    </td></tr>
    <tr><td class="pad" style="padding:6px 36px 34px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.rule};"><tr>
        <td style="padding-top:22px;font-family:${SANS};">
          <div style="font-size:15px;font-weight:700;color:${C.text};">Oluwayemi Akinbande</div>
          <div style="margin-top:2px;font-size:13.5px;color:${C.body};">Senior Service &amp; UX Designer</div>
          <div style="margin-top:12px;font-size:13.5px;">
            <a href="${esc(site.url)}" style="color:${C.brandDark};text-decoration:none;font-weight:600;">${esc(site.host)}</a>
            <span style="color:${C.line};">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
            <a href="${esc(site.linkedin)}" style="color:${C.brandDark};text-decoration:none;font-weight:600;">LinkedIn</a>
          </div>
        </td>
        <td align="right" valign="bottom" style="padding-top:22px;">${button(site.url + 'work/', 'See the work', false)}</td>
      </tr></table>
    </td></tr>`;
  const footer = `You are receiving this because you sent a message through the contact form on <a href="${esc(site.url)}" style="color:${C.label};">${esc(site.host)}</a>. It is a one-off confirmation: your details are used only to reply to you, and you are not on any mailing list.`;
  return {
    subject: `Thanks, ${first(name)}. I've got your message`,
    html: frame({ preheader: `Your message about "${intent}" arrived. I'll reply to ${email}.`, tag: 'Confirmation', inner, footer }),
    text: [`Thank you, ${first(name)}. Your message is with me.`, '', 'I read every enquiry myself and reply personally by email. Here is a copy of what you sent.', '', ...table.map(([k, v]) => `${k}: ${v}`), ...(message ? ['', 'Your message:', message] : []), '', 'What happens next', `1. Your message is with me.`, `2. I reply by email, to ${email}.`, `3. If it's a fit, we set up a call.`, '', 'Oluwayemi Akinbande', 'Senior Service & UX Designer', site.url, site.linkedin].join('\n'),
  };
}
