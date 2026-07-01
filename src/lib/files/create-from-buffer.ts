import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/admin';
import { inferSourceType } from '@/lib/constants';
import { sanitizeUploadFileName } from '@/lib/upload/client';
import { buildUploadSizeMetadata } from '@/lib/upload/size-hints';
import { enqueueFileProcessing } from '@/lib/processing/enqueue';
import type { SourceType } from '@/types/database';

const BUCKET = () => process.env.SUPABASE_STORAGE_BUCKET || 'briefnexus-files';

export async function createProjectFileFromBuffer(options: {
  supabase: SupabaseClient;
  projectId: string;
  uploadedBy: string;
  fileName: string;
  buffer?: Buffer;
  extractedText?: string | null;
  mimeType?: string;
  sourceType: SourceType;
  userNote?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<{ fileId: string } | { error: string }> {
  const fileName = sanitizeUploadFileName(options.fileName);
  let storagePath: string | null = null;

  if (options.buffer && options.buffer.length > 0) {
    storagePath = `${options.projectId}/${Date.now()}-${fileName}`;
    const admin = createServiceClient();
    const { error: uploadError } = await admin.storage.from(BUCKET()).upload(storagePath, options.buffer, {
      contentType: options.mimeType || 'application/octet-stream',
      upsert: false,
    });
    if (uploadError) {
      return { error: uploadError.message };
    }
  }

  const byteSize = options.buffer?.length ?? Buffer.byteLength(options.extractedText ?? '', 'utf8');

  const insertPayload: Record<string, unknown> = {
    project_id: options.projectId,
    uploaded_by: options.uploadedBy,
    file_name: fileName,
    file_type: options.mimeType ?? 'text/plain',
    source_type: options.sourceType,
    storage_path: storagePath,
    extracted_text: options.extractedText?.trim() || null,
    status: 'pending',
    metadata: {
      ...buildUploadSizeMetadata(byteSize),
      ...(options.metadata ?? {}),
      processing_progress: {
        stage: 'queued',
        percent: 0,
        label: 'Queued for processing…',
        updated_at: new Date().toISOString(),
      },
    },
  };

  if (options.userNote?.trim()) {
    insertPayload.user_note = options.userNote.trim();
  }

  const { data, error } = await options.supabase
    .from('files')
    .insert(insertPayload)
    .select('id')
    .single();

  if (error || !data) {
    if (storagePath) {
      const admin = createServiceClient();
      await admin.storage.from(BUCKET()).remove([storagePath]);
    }
    return { error: error?.message ?? 'Failed to create file record' };
  }

  enqueueFileProcessing(data.id, { resume: false });
  return { fileId: data.id };
}

/**
 * Register a file that was already uploaded directly to storage (e.g. via a
 * signed upload URL from the browser, bypassing the API body-size limit).
 * The object is expected to already exist at `storagePath`.
 */
export async function createProjectFileFromStoragePath(options: {
  supabase: SupabaseClient;
  projectId: string;
  uploadedBy: string;
  fileName: string;
  storagePath: string;
  byteSize: number;
  mimeType?: string;
  sourceType: SourceType;
  userNote?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<{ fileId: string } | { error: string }> {
  const fileName = sanitizeUploadFileName(options.fileName);

  const insertPayload: Record<string, unknown> = {
    project_id: options.projectId,
    uploaded_by: options.uploadedBy,
    file_name: fileName,
    file_type: options.mimeType ?? 'application/octet-stream',
    source_type: options.sourceType,
    storage_path: options.storagePath,
    extracted_text: null,
    status: 'pending',
    metadata: {
      ...buildUploadSizeMetadata(options.byteSize),
      ...(options.metadata ?? {}),
      processing_progress: {
        stage: 'queued',
        percent: 0,
        label: 'Queued for processing…',
        updated_at: new Date().toISOString(),
      },
    },
  };

  if (options.userNote?.trim()) {
    insertPayload.user_note = options.userNote.trim();
  }

  const { data, error } = await options.supabase
    .from('files')
    .insert(insertPayload)
    .select('id')
    .single();

  if (error || !data) {
    const admin = createServiceClient();
    await admin.storage.from(BUCKET()).remove([options.storagePath]);
    return { error: error?.message ?? 'Failed to create file record' };
  }

  enqueueFileProcessing(data.id, { resume: false });
  return { fileId: data.id };
}

export function inferSourceTypeFromAttachment(fileName: string, contentType: string): SourceType {
  return inferSourceType(fileName, contentType || 'application/octet-stream');
}
