import { after } from 'next/server';
import { runFileProcessing } from '@/lib/processing/run-file-processing';

export interface EnqueueFileProcessingOptions {
  resume?: boolean;
  force?: boolean;
}

/** Schedule durable background processing via Next.js after() / Vercel waitUntil. */
export function enqueueFileProcessing(
  fileId: string,
  options: EnqueueFileProcessingOptions = {}
): void {
  after(async () => {
    try {
      await runFileProcessing(fileId, options);
    } catch (error) {
      console.error(
        'Background file processing failed:',
        error instanceof Error ? error.message : 'Unknown'
      );
    }
  });
}
