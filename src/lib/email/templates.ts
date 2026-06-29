import { APP_NAME, APP_DOMAIN, AI_EMPLOYEE_NAME } from '@/lib/constants';

/**
 * Branded transactional email templates.
 *
 * Built with table-based layout + inline styles for broad email-client support
 * (Gmail, Outlook, Apple Mail). Avoid external CSS, flexbox, and inline SVG.
 */

const BRAND = {
  gradient: 'linear-gradient(135deg, #5b9cf6 0%, #7c6cf0 52%, #9333ea 100%)',
  gradientFallback: '#7c6cf0',
  ink: '#0e1115',
  body: '#3f4654',
  muted: '#8a93a5',
  hairline: '#e8ebef',
  surface: '#ffffff',
  canvas: '#f5f6f8',
};

/** 2x2 rounded-dot logo mark rendered with nested tables (no SVG). */
function logoMark(): string {
  const dot = (opacity: number) =>
    `<td width="13" height="13" style="width:13px;height:13px;background:rgba(255,255,255,${opacity});border-radius:4px;font-size:0;line-height:0;">&nbsp;</td>`;
  const gap = `<td width="5" style="width:5px;font-size:0;line-height:0;">&nbsp;</td>`;
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr>${dot(0.55)}${gap}${dot(0.75)}</tr>
      <tr><td height="5" colspan="3" style="height:5px;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr>${dot(0.85)}${gap}${dot(1)}</tr>
    </table>`;
}

function ctaButton(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 auto;">
      <tr>
        <td align="center" style="border-radius:12px;background:${BRAND.gradientFallback};background:${BRAND.gradient};">
          <a href="${href}" target="_blank"
            style="display:inline-block;padding:14px 30px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;letter-spacing:-0.01em;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

function shell(innerHtml: string, preheader: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.canvas};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${BRAND.canvas};">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.canvas};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;border-collapse:separate;">
          <!-- Header -->
          <tr>
            <td style="padding:26px 36px;border-radius:18px 18px 0 0;background:${BRAND.gradientFallback};background:${BRAND.gradient};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle">${logoMark()}</td>
                  <td width="14" style="width:14px;">&nbsp;</td>
                  <td valign="middle" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:19px;font-weight:600;letter-spacing:-0.02em;color:#ffffff;">
                    ${APP_NAME}<span style="color:rgba(255,255,255,0.65);font-weight:400;">.${APP_DOMAIN.split('.')[1] ?? 'dev'}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="padding:40px 36px 36px;background:${BRAND.surface};border-radius:0 0 18px 18px;border:1px solid ${BRAND.hairline};border-top:none;">
              ${innerHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 36px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;color:${BRAND.muted};">
              You're receiving this because an account was created at ${APP_DOMAIN}.<br>
              &copy; ${new Date().getFullYear()} ${APP_NAME} &middot; ${APP_DOMAIN}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export type WelcomeEmailInput = {
  fullName?: string;
  appUrl: string;
};

export function renderWelcomeEmail(input: WelcomeEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = (input.fullName ?? '').trim().split(/\s+/)[0] || 'there';
  const subject = `Welcome to ${APP_NAME} — you're in`;
  const preheader = `Your account is ready. ${AI_EMPLOYEE_NAME} is standing by. You can confirm your email anytime.`;

  const font =
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";

  const inner = `
    <h1 style="margin:0 0 14px;${font}font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-0.02em;color:${BRAND.ink};">
      Welcome aboard, ${firstName}.
    </h1>
    <p style="margin:0 0 18px;${font}font-size:15px;line-height:1.65;color:${BRAND.body};">
      Your ${APP_NAME} account is ready to go, with no waiting around. Meet ${AI_EMPLOYEE_NAME}, your AI employee for client work. Upload decks, emails, meetings, and notes, then get briefs, risks, and follow-ups with every source cited.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0;">
      <tr><td align="center">${ctaButton(input.appUrl, `Open ${APP_NAME}`)}</td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 6px;background:${BRAND.canvas};border-radius:12px;">
      <tr>
        <td style="padding:16px 18px;${font}font-size:13.5px;line-height:1.6;color:${BRAND.body};">
          <strong style="color:${BRAND.ink};">No need to confirm your email right now.</strong> You're already signed in and can start using everything today, so confirm whenever it's convenient.
        </td>
      </tr>
    </table>
    <p style="margin:24px 0 0;${font}font-size:13px;line-height:1.6;color:${BRAND.muted};">
      If the button doesn't work, copy and paste this link:<br>
      <a href="${input.appUrl}" target="_blank" style="color:#7c6cf0;text-decoration:none;word-break:break-all;">${input.appUrl}</a>
    </p>`;

  const text = [
    `Welcome aboard, ${firstName}.`,
    '',
    `Your ${APP_NAME} account is ready to go, with no waiting around. Meet ${AI_EMPLOYEE_NAME}, your AI employee for client work. Upload decks, emails, meetings, and notes, then get briefs, risks, and follow-ups with every source cited.`,
    '',
    `Open ${APP_NAME}: ${input.appUrl}`,
    '',
    `No need to confirm your email right now. You're already signed in and can start using everything today, so confirm whenever it's convenient.`,
    '',
    `© ${new Date().getFullYear()} ${APP_NAME} · ${APP_DOMAIN}`,
  ].join('\n');

  return { subject, html: shell(inner, preheader), text };
}
