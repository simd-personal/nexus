import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { enqueueFileProcessing } from '@/lib/processing/enqueue';
import { isProcessingActive } from '@/lib/processing/progress';

export const maxDuration = 300;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
      status: 'processing',
      metadata: {
        ...(file.metadata as Record<string, unknown>),
        processing_phase: 'extract',
        processing_progress: {
          stage: 'queued',
          percent: 0,
          label: 'Queued for reprocessing…',
          updated_at: new Date().toISOString(),
        },
      },
    })
    .eq('id', file.id);

  enqueueFileProcessing(file.id, { resume: false });

  return NextResponse.json({ success: true, status: 'processing' });
}
