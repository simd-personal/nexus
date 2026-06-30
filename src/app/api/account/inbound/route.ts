import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildUserInboundAddress } from '@/lib/inbound/addresses';
import { requireRequestAuth } from '@/lib/supabase/request-auth';

export async function GET(request: NextRequest) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const { data: profile } = await auth.supabase
    .from('profiles')
    .select('inbound_token')
    .eq('user_id', auth.user.id)
    .single();

  if (!profile?.inbound_token) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json(
    {
      address: buildUserInboundAddress(profile.inbound_token),
      subject_hint: 'Include the client and project name in the subject, e.g. [Acme · Q3 Review]',
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
