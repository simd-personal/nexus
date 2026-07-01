import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireRequestAuth } from '@/lib/supabase/request-auth';
import { createServiceClient } from '@/lib/supabase/admin';
import { sanitizeUploadFileName } from '@/lib/upload/client';
import { enqueueFileProcessing } from '@/lib/processing/enqueue';
import { ingestProjectFileUpload } from '@/lib/upload/ingest-file';
import { createProjectFileFromStoragePath } from '@/lib/files/create-from-buffer';
import { inferSourceType } from '@/lib/constants';
import { buildUploadBatchMetadata } from '@/lib/processing/upload-batch';
import { validateUploadByteSize } from '@/lib/upload/limits';
import { extractZipArchive, guessMimeType, isZipFile } from '@/lib/upload/zip-extract';

export const maxDuration = 300;

const BUCKET = () => process.env.SUPABASE_STORAGE_BUCKET || 'briefnexus-files';

/**
 * Registers a file that was uploaded directly to Supabase Storage via a signed
 * upload URL (see POST /api/upload/sign). Only metadata crosses the wire here,
 * so it is not subject to the serverless request-body size limit.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRequestAuth(request);
    if (auth.response) return auth.response;
    const { user, supabase } = auth;

    const body = (await request.json()) as {
      project_id?: string;
      storage_path?: string;
      file_name?: string;
      content_type?: string;
      size?: number;
      user_note?: string | null;
      upload_batch_id?: string | null;
      upload_batch_total?: number | null;
    };

    const projectId = body.project_id;
    const storagePath = body.storage_path;
    const rawName = body.file_name;
    const size = Number(body.size);
    const userNote = body.user_note?.trim() || null;

    if (!projectId || !storagePath || !rawName) {
      return NextResponse.json(
        { error: 'Project ID, storage path, and file name required' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(size) || size <= 0) {
      return NextResponse.json({ error: 'A valid file size is required' }, { status: 400 });
    }

    // The signed URL always writes under `${projectId}/…`; reject anything else
    // so a client cannot attach an object outside its own project prefix.
    if (!storagePath.startsWith(`${projectId}/`)) {
      return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 });
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const fileName = sanitizeUploadFileName(rawName);
    const mimeType = body.content_type || 'application/octet-stream';
    const uploadKind = isZipFile(fileName, mimeType) ? 'zip' : 'file';

    const sizeCheck = validateUploadByteSize(size, uploadKind);
    if (!sizeCheck.ok) {
      const admin = createServiceClient();
      await admin.storage.from(BUCKET()).remove([storagePath]);
      return NextResponse.json({ error: sizeCheck.error }, { status: 413 });
    }

    const uploadBatchTotal =
      typeof body.upload_batch_total === 'number' ? body.upload_batch_total : undefined;
    const uploadBatchMeta = buildUploadBatchMetadata({
      uploadBatchId: body.upload_batch_id ?? null,
      uploadBatchTotal,
    });

    const admin = createServiceClient();

    if (uploadKind === 'zip') {
      const { data: blob, error: downloadError } = await admin.storage
        .from(BUCKET())
        .download(storagePath);
      if (downloadError || !blob) {
        return NextResponse.json(
          { error: downloadError?.message ?? 'Could not read uploaded archive' },
          { status: 500 }
        );
      }
      const buffer = Buffer.from(await blob.arrayBuffer());
      // The individual entries are re-uploaded as their own objects below.
      await admin.storage.from(BUCKET()).remove([storagePath]);

      const { entries, skipped } = await extractZipArchive(buffer);
      if (entries.length === 0) {
        return NextResponse.json(
          {
            error:
              skipped.length > 0
                ? 'No supported files found in this zip. Sunny can read PDFs, DOCX, TXT, spreadsheets, images, audio, and email files inside archives.'
                : 'This zip archive is empty or only contains unsupported files.',
            skipped,
          },
          { status: 400 }
        );
      }

      const zipBatchId = entries.length > 1 ? randomUUID() : null;
      const zipMeta = {
        extracted_from_zip: fileName,
        zip_entry_count: entries.length,
        ...buildUploadBatchMetadata({
          uploadBatchId: zipBatchId,
          uploadBatchTotal: entries.length,
        }),
      };

      const created: Array<{ id: string; file_name: string }> = [];
      const ingestErrors: string[] = [];

      for (const entry of entries) {
        const ingested = await ingestProjectFileUpload({
          supabase,
          projectId,
          userId: user.id,
          fileName: entry.name,
          buffer: entry.buffer,
          mimeType: guessMimeType(entry.name),
          userNote,
          extraMetadata: zipMeta,
        });

        if ('error' in ingested) {
          ingestErrors.push(`${entry.name}: ${ingested.error}`);
          continue;
        }

        const { data: record } = await supabase
          .from('files')
          .select('id, file_name')
          .eq('id', ingested.fileId)
          .single();

        if (record) created.push(record);
      }

      for (const record of created) {
        enqueueFileProcessing(record.id, { resume: false });
      }

      if (created.length === 0) {
        return NextResponse.json(
          { error: ingestErrors[0] ?? 'Could not extract files from zip', skipped },
          { status: 500 }
        );
      }

      return NextResponse.json({
        data: created,
        zip_extracted: true,
        archive_name: fileName,
        skipped: [...skipped, ...ingestErrors],
      });
    }

    const result = await createProjectFileFromStoragePath({
      supabase,
      projectId,
      uploadedBy: user.id,
      fileName,
      storagePath,
      byteSize: size,
      mimeType,
      sourceType: inferSourceType(fileName, mimeType),
      userNote,
      metadata: uploadBatchMeta,
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const { data: fileRecord, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', result.fileId)
      .single();

    if (fetchError || !fileRecord) {
      return NextResponse.json({ error: 'Upload succeeded but file record missing' }, { status: 500 });
    }

    return NextResponse.json({ data: fileRecord });
  } catch (error) {
    console.error('Upload finalize error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
