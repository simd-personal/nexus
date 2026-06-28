import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getInboundAttachmentViewType } from '@/lib/inbound/attachment-preview';
import { getPendingInboundEventForUser } from '@/lib/inbound/pending-access';
import {
  formatPendingEmailForView,
  hasAssignableInboundContent,
  resolvePendingEmailPayload,
} from '@/lib/inbound/pending-content';

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

  const result = await getPendingInboundEventForUser(supabase, user.id, id);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const record = result.event;
  const payload = await resolvePendingEmailPayload(record);
  const view = formatPendingEmailForView(record, payload);

  return NextResponse.json({
    id: record.id,
    created_at: record.created_at,
    attachment_count: record.attachment_count,
    assignable: hasAssignableInboundContent(record),
    ...view,
    attachments: view.attachments.map((attachment, index) => ({
      ...attachment,
      index,
      viewType: getInboundAttachmentViewType(attachment.contentType, attachment.filename),
      previewUrl: `/api/inbound/pending/${record.id}/attachments/${index}`,
    })),
  });
}
