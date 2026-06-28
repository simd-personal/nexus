import type { SupabaseClient } from '@supabase/supabase-js';
import { ingestInboundEmail } from '@/lib/inbound/ingest';
import {
  deletePendingInboundPayload,
  loadPendingInboundPayload,
} from '@/lib/inbound/pending-payload';

const ACTIONABLE_STATUSES = new Set(['pending_assignment', 'unmatched']);

function canAccessPendingEvent(event: { owner_id: string | null }, ownerId: string): boolean {
  if (!event.owner_id) return true;
  return event.owner_id === ownerId;
}

export async function assignPendingInboundEmail(
  supabase: SupabaseClient,
  params: { eventId: string; projectId: string; ownerId: string }
): Promise<{ fileIds: string[] } | { error: string }> {
  const { data: event, error: eventError } = await supabase
    .from('inbound_email_events')
    .select('id, owner_id, status, payload_storage_path')
    .eq('id', params.eventId)
    .single();

  if (eventError || !event) {
    return { error: 'Inbound email not found' };
  }

  if (!canAccessPendingEvent(event, params.ownerId)) {
    return { error: 'Unauthorized' };
  }

  if (!ACTIONABLE_STATUSES.has(event.status)) {
    return { error: 'This email has already been handled' };
  }

  if (!event.payload_storage_path) {
    return {
      error:
        'Email content was not saved for this entry. Forward the message again from Outlook, then assign the new dashboard item.',
    };
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, owner_id')
    .eq('id', params.projectId)
    .single();

  if (projectError || !project || project.owner_id !== params.ownerId) {
    return { error: 'Project not found' };
  }

  const payload = await loadPendingInboundPayload(event.payload_storage_path);
  if (!payload) {
    return { error: 'Email content could not be loaded' };
  }

  const ingested = await ingestInboundEmail(supabase, {
    projectId: project.id,
    ownerId: params.ownerId,
    routing: 'manual_assignment',
  }, payload);

  if ('error' in ingested) {
    await supabase
      .from('inbound_email_events')
      .update({
        status: 'failed',
        owner_id: params.ownerId,
        detail: ingested.error,
      })
      .eq('id', params.eventId);
    return ingested;
  }

  await supabase
    .from('inbound_email_events')
    .update({
      status: 'processed',
      owner_id: params.ownerId,
      project_id: project.id,
      detail: 'Assigned manually from dashboard',
      file_ids: ingested.fileIds,
    })
    .eq('id', params.eventId);

  await supabase
    .from('projects')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', project.id);

  await deletePendingInboundPayload(event.payload_storage_path);

  return { fileIds: ingested.fileIds };
}

export async function dismissPendingInboundEmail(
  supabase: SupabaseClient,
  params: { eventId: string; ownerId: string }
): Promise<{ error?: string }> {
  const { data: event, error: eventError } = await supabase
    .from('inbound_email_events')
    .select('id, owner_id, status, payload_storage_path')
    .eq('id', params.eventId)
    .single();

  if (eventError || !event) {
    return { error: 'Inbound email not found' };
  }

  if (!canAccessPendingEvent(event, params.ownerId)) {
    return { error: 'Unauthorized' };
  }

  if (!ACTIONABLE_STATUSES.has(event.status)) {
    return { error: 'This email has already been handled' };
  }

  await supabase
    .from('inbound_email_events')
    .update({
      status: 'dismissed',
      owner_id: params.ownerId,
      detail: 'Dismissed from dashboard',
    })
    .eq('id', params.eventId);

  if (event.payload_storage_path) {
    await deletePendingInboundPayload(event.payload_storage_path);
  }

  return {};
}
