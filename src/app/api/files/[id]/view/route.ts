import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFileExtension, IMAGE_EXTENSIONS } from '@/lib/constants';

type ViewType = 'image' | 'pdf' | 'text' | 'unsupported';

function inferViewType(fileName: string, mimeType: string): ViewType {
  const lower = fileName.toLowerCase();
  if (mimeType.startsWith('image/') || IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    return 'image';
  }
  if (mimeType === 'application/pdf' || lower.endsWith('.pdf')) {
    return 'pdf';
  }
  if (
    mimeType.startsWith('text/') ||
    ['.txt', '.md', '.markdown', '.csv', '.vtt', '.srt', '.eml'].includes(getFileExtension(lower))
  ) {
    return 'text';
  }
  return 'unsupported';
}

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
    .select('id, file_name, file_type, storage_path, extracted_text, status, project_id')
    .eq('id', id)
    .single();

  if (error || !file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const viewType = inferViewType(file.file_name, file.file_type);
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'briefnexus-files';

  let url: string | null = null;
  if (file.storage_path) {
    const { data: signed, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(file.storage_path, 3600);

    if (signError || !signed?.signedUrl) {
      return NextResponse.json({ error: 'Could not load file preview' }, { status: 500 });
    }
    url = signed.signedUrl;
  }

  return NextResponse.json({
    fileName: file.file_name,
    mimeType: file.file_type,
    viewType,
    url,
    text: file.extracted_text,
    status: file.status,
    hasOriginal: Boolean(file.storage_path),
  });
}
