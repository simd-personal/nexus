import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { provisionEnterpriseOrganization } from '@/lib/organizations/provision';
import { getSiteUrlFromRequest, safeAuthNextPath } from '@/lib/auth/site-url';
import type { OrganizationIndustry } from '@/types/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeAuthNextPath(searchParams.get('next'));
  const siteUrl = getSiteUrlFromRequest(request);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.account_type === 'enterprise') {
        const orgName = String(user.user_metadata.organization_name ?? '').trim();
        const industry = (user.user_metadata.organization_industry ?? 'other') as OrganizationIndustry;
        if (orgName) {
          await provisionEnterpriseOrganization(supabase, user.id, orgName, industry);
        }
      }

      const pendingPlan = user?.user_metadata?.pending_checkout_plan;
      if (pendingPlan === 'pro' || pendingPlan === 'pro-annual') {
        return NextResponse.redirect(`${siteUrl}/upgrade?plan=${pendingPlan}`);
      }

      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${siteUrl}/login?error=auth`);
}
