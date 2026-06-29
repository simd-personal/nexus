import type { SupabaseClient } from '@supabase/supabase-js';
import { inferSourceType } from '@/lib/constants';
import { createProjectFileFromBuffer } from '@/lib/files/create-from-buffer';

export async function ingestProjectFileUpload(options: {
  supabase: SupabaseClient;
  projectId: string;
  userId: string;
  fileName: string;
  buffer: Buffer;
  mimeType: string;
  userNote?: string | null;
  extraMetadata?: Record<string, unknown>;
}): Promise<{ fileId: string } | { error: string }> {
  const fileName = options.fileName;
  const sourceType = inferSourceType(fileName, options.mimeType);

  const result = await createProjectFileFromBuffer({
    supabase: options.supabase,
    projectId: options.projectId,
    uploadedBy: options.userId,
    fileName,
    buffer: options.buffer,
    mimeType: options.mimeType,
    sourceType,
    userNote: options.userNote,
    metadata: options.extraMetadata,
  });

  if ('error' in result) return { error: result.error };
  return { fileId: result.fileId };
}
