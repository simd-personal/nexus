import { NextRequest, NextResponse } from 'next/server';
import { requireRequestAuth } from '@/lib/supabase/request-auth';
import { createServiceClient } from '@/lib/supabase/admin';
import { isProcessingActive } from '@/lib/processing/progress';

export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  const { supabase } = auth;

  const { data: file, error } = await supabase
    .from('files')
    .select('id, project_id, file_name, status, metadata')
    .eq('id', id)
    .single();

  if (error || !file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  if (isProcessingActive(file.status, file.metadata as Record<string, unknown>)) {
    return NextResponse.json({ error: 'File is already processing' }, { status: 409 });
  }

  const admin = createServiceClient();
  await admin.from('chunks').delete().eq('file_id', file.id);
  await admin.from('entities').delete().eq('source_file_id', file.id);
  await admin
    .from('files')
    .update({
      status: 'pending',
      metadata: {
        ...(file.metadata as Record<string, unknown>),
        processing_phase: 'extract',
        processing_lock: null,
        processing_progress: {
          stage: 'queued',
          percent: 0,
          label: 'Queued for reprocessing…',
          updated_at: new Date().toISOString(),
        },
      },
    })
    .eq('id', file.id);

  return NextResponse.json({ success: true, status: 'pending', file_id: file.id });
}
