import { describe, expect, it } from 'vitest';
import { getFileProcessingDisplay } from '@/lib/processing/user-messages';
import type { FileRecord } from '@/types/database';

describe('getFileProcessingDisplay', () => {
  it('returns a headline for processing files', () => {
    const file = {
      status: 'processing',
      metadata: {
        processing_progress: {
          stage: 'finishing',
          percent: 96,
          label: 'Saving Sunny update…',
        },
      },
    } as Pick<FileRecord, 'status' | 'metadata'>;

    const display = getFileProcessingDisplay(file);
    expect(display?.headline).toBe('Saving Sunny update…');
  });
});
