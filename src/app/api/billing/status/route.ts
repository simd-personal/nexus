import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildBillingStatusSnapshot } from '@/lib/billing/billing-status';

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
    .select('plan, subscription_status, account_type')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json(
    buildBillingStatusSnapshot({
      plan: profile?.plan,
      subscription_status: profile?.subscription_status,
      account_type: profile?.account_type,
      email: user.email,
    })
  );
}
