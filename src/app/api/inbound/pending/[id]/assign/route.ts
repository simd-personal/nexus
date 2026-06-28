import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { assignPendingInboundEmail } from '@/lib/inbound/assign-pending';

export async function POST(
  request: NextRequest,
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

  const body = await request.json().catch(() => null);
  const projectId = typeof body?.project_id === 'string' ? body.project_id : '';
  if (!projectId) {
    return NextResponse.json({ error: 'Choose a project' }, { status: 400 });
  }

  const result = await assignPendingInboundEmail(supabase, {
    eventId: id,
    projectId,
    ownerId: user.id,
  });

  if ('error' in result) {
    const status = result.error === 'Unauthorized' ? 403 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    ok: true,
    project_id: projectId,
    file_ids: result.fileIds,
  });
}
