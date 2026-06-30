import { createClient } from '@/lib/supabase/server';
import { getAccountDisplaySummary } from '@/lib/account/display';

export type AccountSummary = {
  displayName: string;
  subtitle: string;
};

export async function getAccountSummary(): Promise<AccountSummary | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, account_type, default_organization_id')
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

  return getAccountDisplaySummary({
    fullName: profile?.full_name,
    email: user.email,
    accountType: profile?.account_type,
    organizationName,
  });
}
