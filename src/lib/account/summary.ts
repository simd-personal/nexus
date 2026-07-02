import { createClient } from '@/lib/supabase/server';
import { getAccountDisplaySummary } from '@/lib/account/display';
import { hasProAccess } from '@/lib/billing/test-accounts';
import type { RequestSupabaseClient } from '@/lib/supabase/request-auth';
import type { User } from '@supabase/supabase-js';

export type AccountSummary = {
  displayName: string;
  subtitle: string;
  planLabel: 'Free' | 'Pro' | 'Enterprise';
};

export async function getAccountSummaryForUser(
  supabase: RequestSupabaseClient,
  user: User
): Promise<AccountSummary> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, account_type, default_organization_id, plan, subscription_status')
    .eq('user_id', user.id)
    .single();

  let organizationName: string | null = null;
  if (profile?.default_organization_id) {
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', profile.default_organization_id)
      .single();
    organizationName = organization?.name ?? null;
  }

  const planLabel: AccountSummary['planLabel'] =
    profile?.account_type === 'enterprise'
      ? 'Enterprise'
      : hasProAccess({
            plan: profile?.plan,
            subscriptionStatus: profile?.subscription_status,
            accountType: profile?.account_type,
            email: user.email,
          })
        ? 'Pro'
        : 'Free';

  return {
    ...getAccountDisplaySummary({
      fullName: profile?.full_name,
      email: user.email,
      accountType: profile?.account_type,
      organizationName,
    }),
    planLabel,
  };
}

export async function getAccountSummary(): Promise<AccountSummary | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return getAccountSummaryForUser(supabase, user);
}
