import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { provisionEnterpriseOrganization } from '@/lib/organizations/provision';
import type { OrganizationIndustry } from '@/types/database';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

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

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
