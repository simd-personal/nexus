import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAccountDisplaySummary } from '@/lib/account/display';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  const summary = getAccountDisplaySummary({
    fullName: profile?.full_name,
    email: user.email,
    accountType: profile?.account_type,
    organizationName,
  });

  return NextResponse.json(summary);
}
