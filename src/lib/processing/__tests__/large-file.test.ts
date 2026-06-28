import { describe, expect, it } from 'vitest';
import {
  getChunkConfig,
  isLargeDocument,
  shouldPauseForTimeBudget,
  PROCESSING_TIME_BUDGET_MS,
  PROCESSING_TIME_BUFFER_MS,
} from '@/lib/processing/large-file';

describe('large file processing helpers', () => {
  it('uses larger chunks for long documents', () => {
    const small = getChunkConfig(10_000);
    const large = getChunkConfig(120_000);
    expect(large.chunkSize).toBeGreaterThan(small.chunkSize);
    expect(large.rowsPerSheetChunk).toBeGreaterThanOrEqual(small.rowsPerSheetChunk);
  });

  it('flags large documents by size or chunk count', () => {
    expect(isLargeDocument(90_000, 50)).toBe(true);
    expect(isLargeDocument(10_000, 200)).toBe(true);
    expect(isLargeDocument(10_000, 40)).toBe(false);
  });

  it('pauses before the serverless time budget is exhausted', () => {
    const startedAt = Date.now() - (PROCESSING_TIME_BUDGET_MS - PROCESSING_TIME_BUFFER_MS + 1000);
    expect(shouldPauseForTimeBudget(startedAt)).toBe(true);
  });
});
