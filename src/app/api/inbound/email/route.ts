import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/admin';
import {
  parseResendInboundPayload,
  parseSendGridInboundForm,
  type InboundEmailPayload,
} from '@/lib/inbound/parse-payload';
import { ingestInboundEmail, resolveInboundTarget } from '@/lib/inbound/ingest';
import { inboundEventInsertFields } from '@/lib/inbound/pending-content';
import { storePendingInboundPayload } from '@/lib/inbound/pending-payload';

export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== 'production';

  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;

  const headerSecret = request.headers.get('x-upperdeck-inbound-secret');
  if (headerSecret === secret) return true;

  const querySecret = request.nextUrl.searchParams.get('secret');
  return querySecret === secret;
}

async function parseInboundRequest(request: NextRequest): Promise<InboundEmailPayload | null> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    return parseSendGridInboundForm(formData);
  }

  const body = await request.json().catch(() => null);
  return parseResendInboundPayload(body);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await parseInboundRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid inbound email payload' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const resolved = await resolveInboundTarget(supabase, payload);

    if (resolved.status === 'rejected') {
      await supabase.from('inbound_email_events').insert({
        project_id: null,
        owner_id: null,
        from_address: payload.from,
        subject: payload.subject,
        status: 'unmatched',
        detail: resolved.detail,
        ...inboundEventInsertFields(payload),
      });
      return NextResponse.json({ error: resolved.detail }, { status: 422 });
    }

    if (resolved.status === 'pending_assignment') {
      const eventId = randomUUID();
      let payloadStoragePath: string | null = null;
      try {
        payloadStoragePath = await storePendingInboundPayload(eventId, payload);
      } catch (storageError) {
        console.error(
          'Pending inbound payload storage failed:',
          storageError instanceof Error ? storageError.message : 'Unknown'
        );
      }

      await supabase.from('inbound_email_events').insert({
        id: eventId,
        project_id: null,
        owner_id: resolved.ownerId,
        from_address: payload.from,
        subject: payload.subject,
        status: 'pending_assignment',
        detail: resolved.detail,
        payload_storage_path: payloadStoragePath,
        ...inboundEventInsertFields(payload),
      });

      return NextResponse.json({
        ok: true,
        pending_assignment: true,
        event_id: eventId,
      });
    }

    const ingested = await ingestInboundEmail(supabase, resolved.target, payload);
    if ('error' in ingested) {
      await supabase.from('inbound_email_events').insert({
        project_id: resolved.target.projectId,
        owner_id: resolved.target.ownerId,
        from_address: payload.from,
        subject: payload.subject,
        status: 'failed',
        detail: ingested.error,
        ...inboundEventInsertFields(payload),
      });
      return NextResponse.json({ error: ingested.error }, { status: 500 });
    }

    await supabase.from('inbound_email_events').insert({
      project_id: resolved.target.projectId,
      owner_id: resolved.target.ownerId,
      from_address: payload.from,
      subject: payload.subject,
      status: 'processed',
      detail: `Routed via ${resolved.target.routing}`,
      file_ids: ingested.fileIds,
      ...inboundEventInsertFields(payload),
    });

    await supabase
      .from('projects')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', resolved.target.projectId);

    return NextResponse.json({
      ok: true,
      project_id: resolved.target.projectId,
      file_ids: ingested.fileIds,
    });
  } catch (error) {
    console.error('Inbound email error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
