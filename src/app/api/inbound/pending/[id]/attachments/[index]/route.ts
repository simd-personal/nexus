import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPendingInboundEventForUser } from '@/lib/inbound/pending-access';
import { resolvePendingEmailPayload } from '@/lib/inbound/pending-content';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; index: string }> }
) {
  const { id, index: indexParam } = await params;
  const attachmentIndex = Number(indexParam);
  if (!Number.isInteger(attachmentIndex) || attachmentIndex < 0) {
    return NextResponse.json({ error: 'Invalid attachment' }, { status: 400 });
  }

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

  const payload = await resolvePendingEmailPayload(result.event);
  const attachment = payload?.attachments[attachmentIndex];
  if (!attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
  }

  const download = request.nextUrl.searchParams.get('download') === '1';
  const safeName = attachment.filename.replace(/[^\w.\-() ]+/g, '_') || 'attachment';

  return new NextResponse(new Uint8Array(attachment.content), {
    headers: {
      'Content-Type': attachment.contentType || 'application/octet-stream',
      'Content-Length': String(attachment.content.length),
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${safeName}"`,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
