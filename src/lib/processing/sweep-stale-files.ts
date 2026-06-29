import { createServiceClient } from '@/lib/supabase/admin';
import { enqueueFileProcessing } from '@/lib/processing/enqueue';
import { needsProcessingKick } from '@/lib/processing/progress';

export interface StaleFileCandidate {
  id: string;
  status: string;
}

export interface SweepStaleFilesResult {
  scanned: number;
  kicked: number;
  skipped: number;
  file_ids: string[];
  errors: string[];
}

/** Max files to re-queue per cron invocation (each may run up to ~300s in background). */
export const SWEEP_BATCH_LIMIT = 8;

export function pickStaleFiles(
  rows: Array<{
    id: string;
    status: string;
    metadata?: Record<string, unknown> | null;
    created_at?: string;
  }>
): StaleFileCandidate[] {
  return rows
    .filter((row) =>
      needsProcessingKick({
        status: row.status,
        metadata: row.metadata ?? undefined,
        created_at: row.created_at,
      })
    )
    .map((row) => ({ id: row.id, status: row.status }));
}

export async function sweepStaleFiles(
  options: { limit?: number; dryRun?: boolean } = {}
): Promise<SweepStaleFilesResult> {
  const limit = options.limit ?? SWEEP_BATCH_LIMIT;
  const supabase = createServiceClient();

  const { data: rows, error } = await supabase
    .from('files')
    .select('id, status, metadata, created_at')
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: true })
    .limit(Math.max(limit * 3, 24));

  if (error) {
    return {
      scanned: 0,
      kicked: 0,
      skipped: 0,
      file_ids: [],
      errors: [error.message],
    };
  }

  const stale = pickStaleFiles(rows ?? []).slice(0, limit);
  const result: SweepStaleFilesResult = {
    scanned: rows?.length ?? 0,
    kicked: 0,
    skipped: (rows?.length ?? 0) - stale.length,
    file_ids: [],
    errors: [],
  };

  if (options.dryRun) {
    result.file_ids = stale.map((f) => f.id);
    return result;
  }

  for (const file of stale) {
    try {
      const resume = file.status === 'processing';
      enqueueFileProcessing(file.id, { resume });
      result.kicked += 1;
      result.file_ids.push(file.id);
    } catch (err) {
      result.errors.push(
        `${file.id}: ${err instanceof Error ? err.message : 'enqueue failed'}`
      );
    }
  }

  return result;
}
