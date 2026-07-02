import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { applyNoStoreHeaders } from '@/lib/auth/cache-control';
import { BLOCKED_SIGNUP_MESSAGE, isEmailBlockedFromSignup } from '@/lib/auth/deleted-accounts';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { provisionEnterpriseOrganization } from '@/lib/organizations/provision';
import { getSiteUrlFromRequest, safeAuthNextPath } from '@/lib/auth/site-url';
import { sendWelcomeEmail } from '@/lib/email/send-welcome';
import type { OrganizationIndustry } from '@/types/database';

const NEW_USER_WINDOW_MS = 5 * 60 * 1000;

/** OAuth signups skip /api/auth/sign-up, so first-time users are detected here. */
function isNewOAuthUser(user: User): boolean {
  if (user.app_metadata?.provider !== 'google') return false;
  const createdAt = new Date(user.created_at).getTime();
  return Number.isFinite(createdAt) && Date.now() - createdAt < NEW_USER_WINDOW_MS;
}

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

      // OAuth signups skip the /api/auth/sign-up guard, so enforce the
      // deleted-free-account block here: remove the just-created user.
      if (user?.email && isNewOAuthUser(user) && (await isEmailBlockedFromSignup(user.email))) {
        await createServiceClient().auth.admin.deleteUser(user.id);
        await supabase.auth.signOut();
        return applyNoStoreHeaders(
          NextResponse.redirect(
            `${siteUrl}/login?mode=signup&message=${encodeURIComponent(BLOCKED_SIGNUP_MESSAGE)}`
          )
        );
      }

      if (user?.user_metadata?.account_type === 'enterprise') {
        const orgName = String(user.user_metadata.organization_name ?? '').trim();
        const industry = (user.user_metadata.organization_industry ?? 'other') as OrganizationIndustry;
        if (orgName) {
          await provisionEnterpriseOrganization(supabase, user.id, orgName, industry);
        }
      }

      const pendingPlan = user?.user_metadata?.pending_checkout_plan;
      if (pendingPlan === 'pro' || pendingPlan === 'pro-annual') {
        return applyNoStoreHeaders(
          NextResponse.redirect(`${siteUrl}/upgrade?plan=${pendingPlan}`)
        );
      }

      if (user && isNewOAuthUser(user)) {
        const fullName = String(
          user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''
        ).trim();
        if (user.email) {
          await sendWelcomeEmail({ email: user.email, fullName });
        }
        // Preserve an explicit checkout redirect; otherwise onboard new users.
        const target = next.startsWith('/upgrade') ? next : '/getting-started';
        return applyNoStoreHeaders(NextResponse.redirect(`${siteUrl}${target}`));
      }

      return applyNoStoreHeaders(NextResponse.redirect(`${siteUrl}${next}`));
    }
  }

  return applyNoStoreHeaders(NextResponse.redirect(`${siteUrl}/login?error=auth`));
}
