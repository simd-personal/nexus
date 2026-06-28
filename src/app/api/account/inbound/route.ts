import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildUserInboundAddress } from '@/lib/inbound/addresses';

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
    .select('inbound_token')
    .eq('user_id', user.id)
    .single();

  if (!profile?.inbound_token) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({
    address: buildUserInboundAddress(profile.inbound_token),
    subject_hint: 'Include the client and project name in the subject, e.g. [Acme · Q3 Review]',
  });
}
