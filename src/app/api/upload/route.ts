import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeUploadFileName } from '@/lib/upload/client';
import { enqueueFileProcessing } from '@/lib/processing/enqueue';
import { ingestProjectFileUpload } from '@/lib/upload/ingest-file';
import { buildUploadSizeMetadata } from '@/lib/upload/size-hints';
import {
  extractZipArchive,
  guessMimeType,
  isZipFile,
} from '@/lib/upload/zip-extract';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const projectId = formData.get('project_id') as string;
    const pastedText = formData.get('pasted_text') as string | null;
    const pastedType = formData.get('pasted_type') as string | null;
    const userNoteRaw = formData.get('user_note') as string | null;
    const userNote = userNoteRaw?.trim() || null;
    const file = formData.get('file') as File | null;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (pastedText) {
      const trimmed = pastedText.trim();
      const fileName =
        pastedType === 'email'
          ? `pasted-email-${Date.now()}.txt`
          : pastedType === 'meeting'
            ? `meeting-notes-${Date.now()}.txt`
            : pastedType === 'transcript'
              ? `call-transcript-${Date.now()}.txt`
              : `pasted-note-${Date.now()}.txt`;
      const sourceType =
        pastedType === 'email'
          ? 'email'
          : pastedType === 'meeting'
            ? 'meeting'
            : pastedType === 'transcript'
              ? 'transcript'
              : 'note';

      const insertPayload: Record<string, unknown> = {
        project_id: projectId,
        uploaded_by: user.id,
        file_name: fileName,
        file_type: 'text/plain',
        source_type: sourceType,
        storage_path: null,
        extracted_text: trimmed,
        status: 'pending',
        metadata: {
          ...buildUploadSizeMetadata(Buffer.byteLength(trimmed, 'utf8')),
          processing_progress: {
            stage: 'queued',
            percent: 0,
            label: 'Queued for processing…',
            updated_at: new Date().toISOString(),
          },
        },
      };
      if (userNote) insertPayload.user_note = userNote;

      const { data: fileRecord, error: insertError } = await supabase
        .from('files')
        .insert(insertPayload)
        .select()
        .single();

      if (insertError || !fileRecord) {
        return NextResponse.json(
          { error: insertError?.message ?? 'Failed to create file record' },
          { status: 500 }
        );
      }

      enqueueFileProcessing(fileRecord.id, { resume: false });
      return NextResponse.json({ data: fileRecord });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file or text provided' }, { status: 400 });
    }

    const fileName = sanitizeUploadFileName(file.name);
    const mimeType = file.type || 'application/octet-stream';
    const buffer = Buffer.from(await file.arrayBuffer());

    if (isZipFile(fileName, mimeType)) {
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

      const zipMeta = {
        extracted_from_zip: fileName,
        zip_entry_count: entries.length,
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

    const ingested = await ingestProjectFileUpload({
      supabase,
      projectId,
      userId: user.id,
      fileName,
      buffer,
      mimeType,
      userNote,
    });

    if ('error' in ingested) {
      return NextResponse.json({ error: ingested.error }, { status: 500 });
    }

    const { data: fileRecord, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', ingested.fileId)
      .single();

    if (fetchError || !fileRecord) {
      return NextResponse.json({ error: 'Upload succeeded but file record missing' }, { status: 500 });
    }

    return NextResponse.json({ data: fileRecord });
  } catch (error) {
    console.error('Upload error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
