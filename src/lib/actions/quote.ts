'use server';

import { sendQuoteRequestToSupport } from '@/lib/email/send-support-notification';
import { createServiceClient } from '@/lib/supabase/admin';
import type { OrganizationIndustry } from '@/types/database';

/** Minimum time (ms) a real person needs to fill the form. Faster => bot. */
const MIN_SUBMIT_MS = 3000;

/** Shown to bots so they can't tell they were blocked. */
const SILENT_SUCCESS = {
  success: true as const,
  message:
    'Thanks. We received your request. Our team will follow up with pricing and onboarding details.',
};

export async function submitOrganizationQuoteRequest(formData: FormData) {
  const fullName = (formData.get('full_name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const companyName = (formData.get('company_name') as string)?.trim();
  const industry = (formData.get('industry') as OrganizationIndustry) || 'other';
  const teamSize = (formData.get('team_size') as string)?.trim() || null;
  const message = (formData.get('message') as string)?.trim() || null;

  // Anti-bot: honeypot field real users never fill.
  const honeypot = (formData.get('company_website') as string)?.trim();
  if (honeypot) {
    return SILENT_SUCCESS;
  }

  // Anti-bot: reject near-instant submissions (scripts fill and post immediately).
  const renderedAt = Number(formData.get('form_rendered_at'));
  if (Number.isFinite(renderedAt) && renderedAt > 0 && Date.now() - renderedAt < MIN_SUBMIT_MS) {
    return SILENT_SUCCESS;
  }

  if (!fullName || !email || !companyName) {
    return { error: 'Name, email, and company are required.' };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from('organization_quote_requests').insert({
    full_name: fullName,
    email,
    company_name: companyName,
    industry,
    team_size: teamSize,
    message,
  });

  if (error) return { error: error.message };

  const emailResult = await sendQuoteRequestToSupport({
    fullName,
    email,
    companyName,
    industry,
    teamSize,
    message,
  });

  if (!emailResult.sent && !emailResult.skipped) {
    console.error('[quote] Support notification failed:', emailResult.error);
  }

  return {
    success: true,
    message: 'Thanks. We received your request. Our team will follow up with pricing and onboarding details.',
  };
}
