'use server';

import { sendSupportRequestToSupport } from '@/lib/email/send-support-notification';
import type { SupportRequestCategory } from '@/lib/email/templates';
import { requireUser, createClient } from '@/lib/supabase/server';

export type SupportFormState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

const VALID_CATEGORIES = new Set<SupportRequestCategory>(['feedback', 'idea', 'bug']);

export async function submitSupportRequest(
  _prevState: SupportFormState,
  formData: FormData
): Promise<SupportFormState> {
  const honeypot = (formData.get('company_website') as string)?.trim();
  if (honeypot) {
    return { status: 'success', message: 'Thanks — we received your message.' };
  }

  const category = formData.get('category') as SupportRequestCategory;
  const message = (formData.get('message') as string)?.trim();
  const pageUrl = (formData.get('page_url') as string)?.trim() || null;

  if (!VALID_CATEGORIES.has(category)) {
    return { status: 'error', message: 'Choose what kind of request this is.' };
  }

  if (!message || message.length < 10) {
    return { status: 'error', message: 'Please add a bit more detail (at least 10 characters).' };
  }

  if (message.length > 8000) {
    return { status: 'error', message: 'Message is too long. Please shorten it and try again.' };
  }

  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', user.id)
    .maybeSingle();

  const fullName = profile?.full_name?.trim() || user.user_metadata?.full_name?.trim() || '';
  const email = user.email?.trim();
  if (!email) {
    return { status: 'error', message: 'Your account is missing an email address.' };
  }

  const emailResult = await sendSupportRequestToSupport({
    fullName,
    email,
    category,
    message,
    pageUrl,
  });

  if (!emailResult.sent && !emailResult.skipped) {
    console.error('[support] Support notification failed:', emailResult.error);
    return {
      status: 'error',
      message: 'We could not send your request right now. Please try again in a few minutes.',
    };
  }

  const successMessage =
    category === 'bug'
      ? 'Thanks — we received your bug report. We usually fix these within 24–48 hours and will follow up by email.'
      : 'Thanks — we received your message. Our team reviews every submission.';

  return { status: 'success', message: successMessage };
}
