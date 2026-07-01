import { NextRequest, NextResponse } from 'next/server';
import { getAccountSummaryForUser } from '@/lib/account/summary';
import { requireRequestAuth } from '@/lib/supabase/request-auth';

export async function GET(request: NextRequest) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const summary = await getAccountSummaryForUser(auth.supabase, auth.user);
  return NextResponse.json(summary, { headers: { 'Cache-Control': 'no-store' } });
}
