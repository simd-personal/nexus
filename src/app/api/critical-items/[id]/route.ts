import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { recomputeProjectStatus } from '@/lib/projects/health';
import { requireRequestAuth } from '@/lib/supabase/request-auth';
import type { ItemStatus } from '@/types/database';

const ALLOWED_STATUSES = new Set<ItemStatus>(['open', 'acknowledged', 'resolved']);

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const body = (await request.json()) as { status?: ItemStatus };
  const status = body.status;

  if (!status || !ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: 'Valid status required' }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from('critical_items')
    .update({ status })
    .eq('id', id)
    .select('project_id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (data?.project_id) {
    await recomputeProjectStatus(auth.supabase, data.project_id);
  }

  revalidatePath('/critical-items');
  revalidatePath('/dashboard');
  revalidatePath('/projects');
  if (data?.project_id) revalidatePath(`/projects/${data.project_id}`);

  return NextResponse.json({ success: true, status });
}
