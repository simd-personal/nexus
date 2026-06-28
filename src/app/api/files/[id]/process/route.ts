import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { runFileProcessing } from '@/lib/processing/run-file-processing';
import {
  getFileProcessingProgress,
  isProcessingActive,
  isProcessingStale,
} from '@/lib/processing/progress';

export const maxDuration = 300;

export async function GET(
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
    .select('id, status, metadata')
    .eq('id', id)
    .single();

  if (error || !file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  return NextResponse.json({
    status: file.status,
    progress: getFileProcessingProgress(file.metadata as Record<string, unknown>),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const force = new URL(request.url).searchParams.get('force') === '1';

  const { data: file, error } = await supabase
    .from('files')
    .select('id, status, metadata')
    .eq('id', id)
    .single();

  if (error || !file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const metadata = file.metadata as Record<string, unknown>;

  if (file.status === 'processed' && !force) {
    return NextResponse.json({ error: 'File is already processed' }, { status: 409 });
  }

  if (!force && isProcessingActive(file.status, metadata)) {
    return NextResponse.json({
      success: true,
      status: 'processing',
      progress: getFileProcessingProgress(metadata),
    });
  }

  const resume = !force && file.status === 'processing' && isProcessingStale(file.status, metadata);
  const admin = createServiceClient();

  if (file.status === 'pending' || file.status === 'failed' || resume || force) {
    await admin
      .from('files')
      .update({
        status: 'processing',
        metadata: {
          ...metadata,
          processing_lock: null,
          processing_progress: {
            stage: 'queued',
            percent: resume ? 15 : 3,
            label: resume ? 'Resuming processing…' : 'Starting processing…',
            updated_at: new Date().toISOString(),
          },
        },
      })
      .eq('id', id);
  }

  await runFileProcessing(id, { resume, force });

  const { data: updated } = await admin
    .from('files')
    .select('status, metadata')
    .eq('id', id)
    .single();

  return NextResponse.json({
    success: true,
    status: updated?.status ?? 'processing',
    resumed: resume,
    progress: getFileProcessingProgress(updated?.metadata as Record<string, unknown>),
  });
}
