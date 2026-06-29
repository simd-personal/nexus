import { getSupportInboxAddress, sendEmail } from '@/lib/email/client';
import { renderQuoteRequestEmail, type QuoteRequestEmailInput } from '@/lib/email/templates';

/** Notify support when someone submits the public quote request form. */
export async function sendQuoteRequestToSupport(
  input: QuoteRequestEmailInput
): Promise<{ sent: boolean; skipped?: boolean; error?: string }> {
  const { subject, html, text } = renderQuoteRequestEmail(input);

  return sendEmail({
    to: getSupportInboxAddress(),
    subject,
    html,
    text,
    replyTo: input.email,
  });
}
