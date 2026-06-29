import { Resend } from 'resend';
import { APP_NAME, APP_DOMAIN, SUPPORT_EMAIL } from '@/lib/constants';

/**
 * Transactional email via Resend.
 *
 * Sending is best-effort: if RESEND_API_KEY is missing (e.g. local dev) we log
 * and no-op so signup never fails just because email could not be sent.
 */

let cachedClient: Resend | null = null;

function getApiKey(): string | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key || key.includes('your-resend')) return null;
  return key;
}

function getClient(): Resend | null {
  const key = getApiKey();
  if (!key) return null;
  if (!cachedClient) cachedClient = new Resend(key);
  return cachedClient;
}

/** From header, e.g. `UpperDeck <noreply@upperdeck.dev>`. */
export function getFromAddress(): string {
  const configured = process.env.EMAIL_FROM?.trim();
  if (configured) return configured;
  return `${APP_NAME} <noreply@${APP_DOMAIN}>`;
}

/** Inbox for website form submissions (quote requests, etc.). */
export function getSupportInboxAddress(): string {
  return (
    process.env.SUPPORT_EMAIL?.trim() ||
    process.env.EMAIL_SUPPORT_TO?.trim() ||
    SUPPORT_EMAIL
  );
}

/** Reply-to support address. */
export function getReplyToAddress(): string {
  return process.env.EMAIL_REPLY_TO?.trim() || SUPPORT_EMAIL;
}

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** When set, replies from the recipient go to this address (e.g. form submitter). */
  replyTo?: string;
};

export async function sendEmail(
  input: SendEmailInput
): Promise<{ sent: boolean; skipped?: boolean; error?: string }> {
  const client = getClient();
  if (!client) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipped sending "${input.subject}" to ${input.to}`
    );
    return { sent: false, skipped: true };
  }

  try {
    const { error } = await client.emails.send({
      from: getFromAddress(),
      to: input.to,
      replyTo: input.replyTo ?? getReplyToAddress(),
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (error) {
      console.error('[email] Resend send error:', error);
      return { sent: false, error: error.message };
    }
    return { sent: true };
  } catch (err) {
    console.error('[email] Unexpected send failure:', err);
    return { sent: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}
