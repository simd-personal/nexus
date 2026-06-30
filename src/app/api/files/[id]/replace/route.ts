import { NextRequest, NextResponse } from 'next/server';
import { requireRequestAuth } from '@/lib/supabase/request-auth';
import { replaceProjectFileContent } from '@/lib/files/replace-content';
import { sanitizeUploadFileName } from '@/lib/upload/client';
import { validateUploadByteSize } from '@/lib/upload/limits';
import { isZipFile } from '@/lib/upload/zip-extract';

export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 });
  }

  const fileName = sanitizeUploadFileName(file.name);
  const mimeType = file.type || 'application/octet-stream';

  if (isZipFile(fileName, mimeType)) {
    return NextResponse.json(
      { error: 'Replace a single file at a time. Extract zip contents before replacing.' },
      { status: 400 }
    );
  }

  const sizeCheck = validateUploadByteSize(file.size, 'file');
  if (!sizeCheck.ok) {
    return NextResponse.json({ error: sizeCheck.error }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const bufferCheck = validateUploadByteSize(buffer.length, 'file');
  if (!bufferCheck.ok) {
    return NextResponse.json({ error: bufferCheck.error }, { status: 413 });
  }

  const result = await replaceProjectFileContent(auth.supabase, id, {
    buffer,
    fileName,
    mimeType,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });
  }

  return NextResponse.json({ data: result.file, replaced: true });
}
