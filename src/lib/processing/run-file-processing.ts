import { createServiceClient } from '@/lib/supabase/admin';
import {
  getFileProcessingProgress,
  isProcessingActive,
  isProcessingStale,
} from '@/lib/processing/progress';
import { loadFileContent } from '@/lib/processing/load-content';
import { processFile } from '@/lib/processing/pipeline';
import { enqueueFileProcessing } from '@/lib/processing/enqueue';
import {
  getUploadBatchInfo,
  maybeFinalizeUploadBatch,
} from '@/lib/processing/upload-batch';
import type { SourceType } from '@/types/database';
import type { EnqueueFileProcessingOptions } from '@/lib/processing/enqueue';

const LOCK_TTL_MS = 120_000;

async function tryAcquireProcessingLock(
  supabase: ReturnType<typeof createServiceClient>,
  fileId: string,
  metadata: Record<string, unknown>
): Promise<boolean> {
  const lockRaw = metadata.processing_lock;
  if (typeof lockRaw === 'string') {
    const lockAge = Date.now() - new Date(lockRaw).getTime();
    if (lockAge < LOCK_TTL_MS) return false;
  }

  const { data } = await supabase
    .from('files')
    .update({
      metadata: {
        ...metadata,
        processing_lock: new Date().toISOString(),
      },
    })
    .eq('id', fileId)
    .select('metadata')
    .single();

  return Boolean(data);
}

async function finalizeBatchIfNeeded(
  supabase: ReturnType<typeof createServiceClient>,
  fileId: string
): Promise<void> {
  const { data: fresh } = await supabase
    .from('files')
    .select('project_id, metadata')
    .eq('id', fileId)
    .maybeSingle();

  if (!fresh) return;

  const { batchId } = getUploadBatchInfo((fresh.metadata as Record<string, unknown> | null) ?? {});
  if (!batchId) return;

  try {
    await maybeFinalizeUploadBatch(supabase, fresh.project_id, batchId);
  } catch (error) {
    console.error(
      'runFileProcessing: batch finalize error',
      error instanceof Error ? error.message : 'Unknown'
    );
  }
}

export async function runFileProcessing(
  fileId: string,
  options: EnqueueFileProcessingOptions = {}
): Promise<void> {
  const supabase = createServiceClient();
  const { data: file, error } = await supabase
    .from('files')
    .select('id, project_id, file_name, source_type, storage_path, extracted_text, status, metadata')
    .eq('id', fileId)
    .single();

  if (error || !file) {
    console.error('runFileProcessing: file not found', fileId);
    return;
  }

  const metadata = (file.metadata as Record<string, unknown> | undefined) ?? {};
  const resume = options.resume ?? (file.status === 'processing' && isProcessingStale(file.status, metadata));

  if (!resume && isProcessingActive(file.status, metadata)) {
    return;
  }

  if (file.status === 'processed' && !options.force) {
    return;
  }

  const locked = await tryAcquireProcessingLock(supabase, fileId, metadata);
  if (!locked) {
    return;
  }

  try {
    let buffer: Buffer | undefined;
    let pastedText: string | undefined;

    try {
      const content = await loadFileContent(file);
      buffer = content.buffer;
      pastedText = content.pastedText;
    } catch (loadError) {
      if (!file.extracted_text?.trim()) {
        console.error('runFileProcessing: could not load content', loadError);
        await supabase
          .from('files')
          .update({
            status: 'failed',
            metadata: {
              ...metadata,
              processing_lock: null,
              error: 'Could not load file content',
              processing_progress: {
                stage: 'failed',
                percent: 0,
                label: 'Processing failed',
                detail:
                  loadError instanceof Error ? loadError.message : 'Could not load file content',
                updated_at: new Date().toISOString(),
              },
            },
          })
          .eq('id', fileId);
        return;
      }
      pastedText = file.extracted_text;
    }

    try {
      const result = await processFile({
        fileId: file.id,
        projectId: file.project_id,
        fileName: file.file_name,
        sourceType: file.source_type as SourceType,
        buffer,
        pastedText,
        resume,
      });

      if (!result.completed && result.stage === 'embedding') {
        enqueueFileProcessing(fileId, { resume: true });
        return;
      }
    } catch (processingError) {
      console.error(
        'runFileProcessing: pipeline error',
        processingError instanceof Error ? processingError.message : 'Unknown'
      );
      const progress = getFileProcessingProgress(metadata);
      await supabase
        .from('files')
        .update({
          status: 'failed',
          metadata: {
            ...metadata,
            processing_lock: null,
            error: processingError instanceof Error ? processingError.message : 'Processing failed',
            processing_progress: {
              stage: 'failed',
              percent: progress?.percent ?? 0,
              label: 'Processing failed',
              detail:
                processingError instanceof Error ? processingError.message : 'Processing failed',
              updated_at: new Date().toISOString(),
            },
          },
        })
        .eq('id', fileId);
    }
  } finally {
    await finalizeBatchIfNeeded(supabase, fileId);
  }
}
