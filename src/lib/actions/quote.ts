'use server';

import { createServiceClient } from '@/lib/supabase/admin';
import type { OrganizationIndustry } from '@/types/database';

export async function submitOrganizationQuoteRequest(formData: FormData) {
  const fullName = (formData.get('full_name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const companyName = (formData.get('company_name') as string)?.trim();
  const industry = (formData.get('industry') as OrganizationIndustry) || 'other';
  const teamSize = (formData.get('team_size') as string)?.trim() || null;
  const message = (formData.get('message') as string)?.trim() || null;

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

  return {
    success: true,
    message: 'Thanks. We received your request. Our team will follow up with pricing and onboarding details.',
  };
}
