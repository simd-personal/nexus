import { sendEmail } from './client';
import { renderWelcomeEmail } from './templates';
import { getSiteUrlFromHeaders } from '@/lib/auth/site-url';

/**
 * Send the branded welcome email after signup. Best-effort: failures are logged
 * but never thrown, so a flaky email provider can't block account creation.
 */
export async function sendWelcomeEmail(input: {
  email: string;
  fullName?: string;
}): Promise<void> {
  try {
    const siteUrl = await getSiteUrlFromHeaders();
    const appUrl = `${siteUrl}/dashboard`;
    const { subject, html, text } = renderWelcomeEmail({
      fullName: input.fullName,
      appUrl,
    });
    await sendEmail({ to: input.email, subject, html, text });
  } catch (err) {
    console.error('[email] sendWelcomeEmail failed:', err);
  }
}
