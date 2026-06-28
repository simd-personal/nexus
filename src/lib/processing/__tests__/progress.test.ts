import { describe, expect, it } from 'vitest';
import {
  embeddingPercent,
  getFileProcessingProgress,
  isProcessingActive,
  isProcessingStale,
} from '@/lib/processing/progress';

describe('file processing progress', () => {
  it('reads progress from file metadata', () => {
    const progress = getFileProcessingProgress({
      processing_progress: {
        stage: 'embedding',
        percent: 42,
        label: 'Building search index…',
        chunks_done: 100,
        chunks_total: 200,
        updated_at: new Date().toISOString(),
      },
    });
    expect(progress?.percent).toBe(42);
    expect(progress?.chunks_done).toBe(100);
  });

  it('detects active vs stale processing', () => {
    const fresh = {
      processing_progress: {
        stage: 'embedding',
        percent: 40,
        label: 'Indexing',
        updated_at: new Date().toISOString(),
      },
    };
    expect(isProcessingActive('processing', fresh)).toBe(true);
    expect(isProcessingStale('processing', fresh)).toBe(false);

    const stale = {
      processing_progress: {
        stage: 'embedding',
        percent: 40,
        label: 'Indexing',
        updated_at: new Date(Date.now() - 120_000).toISOString(),
      },
    };
    expect(isProcessingActive('processing', stale)).toBe(false);
    expect(isProcessingStale('processing', stale)).toBe(true);
  });

  it('maps embedding progress into the 20-75 percent band', () => {
    expect(embeddingPercent(0, 100)).toBe(20);
    expect(embeddingPercent(50, 100)).toBe(48);
    expect(embeddingPercent(100, 100)).toBe(75);
  });
});
