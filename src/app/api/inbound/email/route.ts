import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/admin';
import {
  parseResendInboundPayload,
  parseSendGridInboundForm,
  type InboundEmailPayload,
} from '@/lib/inbound/parse-payload';
import { ingestInboundEmail, resolveInboundTarget } from '@/lib/inbound/ingest';

export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== 'production';

  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;

  const headerSecret = request.headers.get('x-upperdeck-inbound-secret');
  return headerSecret === secret;
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

    if ('error' in resolved) {
      await supabase.from('inbound_email_events').insert({
        project_id: null,
        owner_id: null,
        from_address: payload.from,
        subject: payload.subject,
        status: 'unmatched',
        detail: resolved.error,
      });
      return NextResponse.json({ error: resolved.error }, { status: 422 });
    }

    const ingested = await ingestInboundEmail(supabase, resolved, payload);
    if ('error' in ingested) {
      await supabase.from('inbound_email_events').insert({
        project_id: resolved.projectId,
        owner_id: resolved.ownerId,
        from_address: payload.from,
        subject: payload.subject,
        status: 'failed',
        detail: ingested.error,
      });
      return NextResponse.json({ error: ingested.error }, { status: 500 });
    }

    await supabase.from('inbound_email_events').insert({
      project_id: resolved.projectId,
      owner_id: resolved.ownerId,
      from_address: payload.from,
      subject: payload.subject,
      status: 'processed',
      detail: `Routed via ${resolved.routing}`,
      file_ids: ingested.fileIds,
    });

    await supabase
      .from('projects')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', resolved.projectId);

    return NextResponse.json({
      ok: true,
      project_id: resolved.projectId,
      file_ids: ingested.fileIds,
    });
  } catch (error) {
    console.error('Inbound email error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
