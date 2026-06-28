import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { enqueueFileProcessing } from '@/lib/processing/enqueue';
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

  const metadata = file.metadata as Record<string, unknown>;

  if (file.status === 'processed') {
    return NextResponse.json({ error: 'File is already processed' }, { status: 409 });
  }

  if (isProcessingActive(file.status, metadata)) {
    return NextResponse.json({
      success: true,
      status: 'processing',
      progress: getFileProcessingProgress(metadata),
    });
  }

  const resume = file.status === 'processing' && isProcessingStale(file.status, metadata);

  if (file.status === 'processing' && !resume) {
    return NextResponse.json({ error: 'File is already processing' }, { status: 409 });
  }

  if (file.status === 'pending' || file.status === 'failed' || resume) {
    const admin = createServiceClient();
    await admin
      .from('files')
      .update({ status: 'processing' })
      .eq('id', id);
  }

  enqueueFileProcessing(id, { resume });

  return NextResponse.json({
    success: true,
    status: 'processing',
    resumed: resume,
  });
}
