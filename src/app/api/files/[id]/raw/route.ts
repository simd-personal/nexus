import { NextRequest, NextResponse } from 'next/server';
import { requireRequestAuth } from '@/lib/supabase/request-auth';
import { createServiceClient } from '@/lib/supabase/admin';

/**
 * Streams the original file bytes with request auth (cookie or Bearer JWT).
 * Used by mobile, where React Native's Image component can send auth headers
 * but cannot reliably load Supabase signed URLs in every environment.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const { id } = await params;

  // RLS on the files table enforces project access for this user.
  const { data: file, error } = await auth.supabase
    .from('files')
    .select('id, file_name, file_type, storage_path')
    .eq('id', id)
    .single();

  if (error || !file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  if (!file.storage_path) {
    return NextResponse.json({ error: 'File has no stored content' }, { status: 404 });
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'briefnexus-files';
  const admin = createServiceClient();
  const { data: blob, error: downloadError } = await admin.storage
    .from(bucket)
    .download(file.storage_path);

  if (downloadError || !blob) {
    return NextResponse.json({ error: 'Could not load file' }, { status: 500 });
  }

  const buffer = Buffer.from(await blob.arrayBuffer());
  const safeName = file.file_name.replace(/[^\w.\-() ]+/g, '_') || 'file';
  const download = request.nextUrl.searchParams.get('download') === '1';

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': file.file_type || 'application/octet-stream',
      'Content-Length': String(buffer.length),
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${safeName}"`,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
