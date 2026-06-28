import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  formatPendingEmailForView,
  hasAssignableInboundContent,
  resolvePendingEmailPayload,
  type PendingInboundEventRecord,
} from '@/lib/inbound/pending-content';

const VIEWABLE_STATUSES = new Set(['pending_assignment', 'unmatched']);

function canAccessPendingEvent(event: { owner_id: string | null }, userId: string): boolean {
  if (!event.owner_id) return true;
  return event.owner_id === userId;
}

export async function GET(
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

  const { data: event, error } = await supabase
    .from('inbound_email_events')
    .select('id, owner_id, status, from_address, subject, body_text, body_preview, payload_storage_path, attachments_meta, attachment_count, created_at')
    .eq('id', id)
    .single();

  if (error || !event) {
    return NextResponse.json({ error: 'Inbound email not found' }, { status: 404 });
  }

  if (!canAccessPendingEvent(event, user.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (!VIEWABLE_STATUSES.has(event.status)) {
    return NextResponse.json({ error: 'This email is no longer in the inbox' }, { status: 410 });
  }

  const record = event as PendingInboundEventRecord;
  const payload = await resolvePendingEmailPayload(record);
  const view = formatPendingEmailForView(record, payload);

  return NextResponse.json({
    id: event.id,
    created_at: event.created_at,
    attachment_count: event.attachment_count,
    assignable: hasAssignableInboundContent(record),
    ...view,
  });
}
