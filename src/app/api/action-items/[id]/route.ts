import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getActionItemById } from '@/lib/data/queries';
import { requireRequestAuth } from '@/lib/supabase/request-auth';
import type { ActionItemStatus } from '@/types/database';

const ALLOWED_STATUSES = new Set<ActionItemStatus>(['open', 'in_progress', 'done', 'cancelled']);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await context.params;
    const item = await getActionItemById(id, auth.supabase);

    if (!item) {
      return NextResponse.json({ error: 'Action item not found' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load action item';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const body = (await request.json()) as { status?: ActionItemStatus; applies_to_me?: boolean };
  const status = body.status;

  if (!status || !ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: 'Valid status required' }, { status: 400 });
  }

  const updates: { status: ActionItemStatus; applies_to_me?: boolean } = { status };
  if (body.applies_to_me !== undefined) {
    updates.applies_to_me = body.applies_to_me;
  }

  const { error } = await auth.supabase.from('action_items').update(updates).eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath('/action-items');
  revalidatePath('/dashboard');

  return NextResponse.json({ success: true, status });
}
