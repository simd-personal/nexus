import { getSupportInboxAddress, sendEmail } from '@/lib/email/client';
import {
  renderQuoteRequestEmail,
  renderSupportRequestEmail,
  type QuoteRequestEmailInput,
  type SupportRequestEmailInput,
} from '@/lib/email/templates';

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

/** Notify support when a signed-in user submits feedback, ideas, or bug reports. */
export async function sendSupportRequestToSupport(
  input: SupportRequestEmailInput
): Promise<{ sent: boolean; skipped?: boolean; error?: string }> {
  const { subject, html, text } = renderSupportRequestEmail(input);

  return sendEmail({
    to: getSupportInboxAddress(),
    subject,
    html,
    text,
    replyTo: input.email,
  });
}
