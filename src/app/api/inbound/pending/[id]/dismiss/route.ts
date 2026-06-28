import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { dismissPendingInboundEmail } from '@/lib/inbound/assign-pending';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await dismissPendingInboundEmail(supabase, {
    eventId: id,
    ownerId: user.id,
  });

  if (result.error) {
    const status = result.error === 'Unauthorized' ? 403 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}
