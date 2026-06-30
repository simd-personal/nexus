import { NextRequest, NextResponse } from 'next/server';
import { getSunnyUpdateById } from '@/lib/data/queries';
import { requireRequestAuth } from '@/lib/supabase/request-auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const update = await getSunnyUpdateById(id, auth.supabase);

  if (!update) {
    return NextResponse.json({ error: 'Update not found' }, { status: 404 });
  }

  return NextResponse.json({ update }, { headers: { 'Cache-Control': 'no-store' } });
}
