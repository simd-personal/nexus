import { createServiceClient } from '@/lib/supabase/admin';
import { isProcessingActive } from '@/lib/processing/progress';
import { loadFileContent } from '@/lib/processing/load-content';
import { processFile } from '@/lib/processing/pipeline';
import type { SourceType } from '@/types/database';
import type { EnqueueFileProcessingOptions } from '@/lib/processing/enqueue';

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

  const resume = options.resume ?? file.status === 'processing';

  if (!resume && isProcessingActive(file.status, file.metadata as Record<string, unknown>)) {
    return;
  }

  if (file.status === 'processed' && !options.resume) {
    return;
  }

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
            ...(file.metadata as Record<string, unknown>),
            error: 'Could not load file content',
            processing_progress: {
              stage: 'failed',
              percent: 0,
              label: 'Processing failed',
              detail: 'Could not load file content',
              updated_at: new Date().toISOString(),
            },
          },
        })
        .eq('id', fileId);
      return;
    }
    pastedText = file.extracted_text;
  }

  await processFile({
    fileId: file.id,
    projectId: file.project_id,
    fileName: file.file_name,
    sourceType: file.source_type as SourceType,
    buffer,
    pastedText,
    resume,
  });
}
