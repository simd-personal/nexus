import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { processFile } from '@/lib/processing/pipeline';
import type { SourceType } from '@/types/database';

export const maxDuration = 60;

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
    .select('id, project_id, file_name, file_type, source_type, storage_path, extracted_text, status')
    .eq('id', id)
    .single();

  if (error || !file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  if (file.status === 'processing') {
    return NextResponse.json({ error: 'File is already processing' }, { status: 409 });
  }

  const admin = createServiceClient();
  await admin.from('chunks').delete().eq('file_id', file.id);
  await admin.from('entities').delete().eq('source_file_id', file.id);

  let buffer: Buffer | undefined;
  const pastedText = !file.storage_path ? file.extracted_text ?? undefined : undefined;

  if (file.storage_path) {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'briefnexus-files';
    const { data: blob, error: downloadError } = await admin.storage
      .from(bucket)
      .download(file.storage_path);

    if (downloadError || !blob) {
      return NextResponse.json({ error: 'Could not download file for reprocessing' }, { status: 500 });
    }

    buffer = Buffer.from(await blob.arrayBuffer());
  }

  if (!buffer && !pastedText?.trim()) {
    return NextResponse.json({ error: 'No file content available to reprocess' }, { status: 400 });
  }

  processFile({
    fileId: file.id,
    projectId: file.project_id,
    fileName: file.file_name,
    sourceType: file.source_type as SourceType,
    buffer,
    pastedText,
  }).catch(console.error);

  return NextResponse.json({ success: true, status: 'processing' });
}
