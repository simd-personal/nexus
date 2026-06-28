import type { SupabaseClient } from '@supabase/supabase-js';
import type { PendingInboundEventRecord } from '@/lib/inbound/pending-content';

const VIEWABLE_STATUSES = new Set(['pending_assignment', 'unmatched']);

export function canAccessPendingEvent(event: { owner_id: string | null }, userId: string): boolean {
  if (!event.owner_id) return true;
  return event.owner_id === userId;
}

export async function getPendingInboundEventForUser(
  supabase: SupabaseClient,
  userId: string,
  eventId: string
): Promise<{ event: PendingInboundEventRecord & { id: string; status: string } } | { error: string; status: number }> {
  const { data: event, error } = await supabase
    .from('inbound_email_events')
    .select('id, owner_id, status, from_address, subject, body_text, body_preview, payload_storage_path, attachments_meta, attachment_count, created_at')
    .eq('id', eventId)
    .single();

  if (error || !event) {
    return { error: 'Inbound email not found', status: 404 };
  }

  if (!canAccessPendingEvent(event, userId)) {
    return { error: 'Unauthorized', status: 403 };
  }

  if (!VIEWABLE_STATUSES.has(event.status)) {
    return { error: 'This email is no longer in the inbox', status: 410 };
  }

  return { event: event as PendingInboundEventRecord & { id: string; status: string } };
}
