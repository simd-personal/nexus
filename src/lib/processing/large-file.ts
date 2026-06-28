/** Characters above which we treat a file as large and tune chunking / UI copy. */
export const LARGE_FILE_CHAR_THRESHOLD = 80_000;

/** Chunk count above which embedding runs in multiple server invocations. */
export const LARGE_FILE_CHUNK_THRESHOLD = 150;

/** Per-invocation wall clock budget on Vercel (leave headroom under maxDuration=300). */
export const PROCESSING_TIME_BUDGET_MS = 240_000;

/** Stop embedding early with this much budget left so the invocation can exit cleanly. */
export const PROCESSING_TIME_BUFFER_MS = 25_000;

export interface ChunkConfig {
  chunkSize: number;
  overlap: number;
  rowsPerSheetChunk: number;
}

export function getChunkConfig(textLength: number): ChunkConfig {
  if (textLength > 500_000) {
    return { chunkSize: 1800, overlap: 250, rowsPerSheetChunk: 50 };
  }
  if (textLength > LARGE_FILE_CHAR_THRESHOLD) {
    return { chunkSize: 1500, overlap: 220, rowsPerSheetChunk: 40 };
  }
  return { chunkSize: 1000, overlap: 200, rowsPerSheetChunk: 35 };
}

export function isLargeDocument(textLength: number, chunkCount: number): boolean {
  return textLength >= LARGE_FILE_CHAR_THRESHOLD || chunkCount >= LARGE_FILE_CHUNK_THRESHOLD;
}

export function timeBudgetRemainingMs(startedAt: number): number {
  return PROCESSING_TIME_BUDGET_MS - (Date.now() - startedAt);
}

export function shouldPauseForTimeBudget(startedAt: number): boolean {
  return timeBudgetRemainingMs(startedAt) <= PROCESSING_TIME_BUFFER_MS;
}

export interface ProcessFileResult {
  completed: boolean;
  stage: string;
  chunkCount?: number;
}
