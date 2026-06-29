import { describe, expect, it } from 'vitest';
import {
  fileStatusLabel,
  getFileProcessingDisplay,
  getStageHelperText,
} from '@/lib/processing/user-messages';

describe('file processing user messages', () => {
  it('maps file statuses to friendly labels', () => {
    expect(fileStatusLabel('pending')).toBe('Queued');
    expect(fileStatusLabel('processing')).toBe('Indexing');
    expect(fileStatusLabel('processed')).toBe('Ready for search');
    expect(fileStatusLabel('failed')).toBe('Failed');
  });

  it('describes queued files with background retry helper', () => {
    const display = getFileProcessingDisplay({
      status: 'pending',
      metadata: {
        processing_progress: {
          stage: 'queued',
          percent: 0,
          label: 'Queued for processing…',
          updated_at: new Date().toISOString(),
        },
      },
    });

    expect(display?.headline).toContain('Queued');
    expect(display?.helper).toMatch(/retried automatically/i);
  });

  it('explains large-file embedding resume', () => {
    const helper = getStageHelperText('embedding', {
      label: 'Large file. Continuing indexing…',
      isLarge: true,
    });
    expect(helper).toMatch(/continues in the background/i);
  });

  it('surfaces failed processing with retry guidance', () => {
    const display = getFileProcessingDisplay({
      status: 'failed',
      metadata: {
        error: 'Could not load file content',
        processing_progress: {
          stage: 'failed',
          percent: 0,
          label: 'Processing failed',
          detail: 'Could not load file content',
          updated_at: new Date().toISOString(),
        },
      },
    });

    expect(display?.detail).toContain('Could not load');
    expect(display?.helper).toMatch(/Reprocess/i);
  });
});
