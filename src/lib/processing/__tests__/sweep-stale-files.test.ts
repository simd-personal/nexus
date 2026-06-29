import { describe, expect, it } from 'vitest';
import { pickStaleFiles } from '@/lib/processing/sweep-stale-files';

describe('pickStaleFiles', () => {
  it('selects pending files that never started processing', () => {
    const stale = pickStaleFiles([
      {
        id: 'f1',
        status: 'pending',
        created_at: new Date(Date.now() - 20_000).toISOString(),
        metadata: {
          processing_progress: {
            stage: 'queued',
            percent: 0,
            label: 'Queued',
            updated_at: new Date(Date.now() - 20_000).toISOString(),
          },
        },
      },
      {
        id: 'f2',
        status: 'processed',
        created_at: new Date().toISOString(),
      },
    ]);

    expect(stale.map((f) => f.id)).toEqual(['f1']);
  });

  it('selects processing files with stale heartbeat', () => {
    const stale = pickStaleFiles([
      {
        id: 'f3',
        status: 'processing',
        metadata: {
          processing_progress: {
            stage: 'embedding',
            percent: 40,
            label: 'Indexing',
            updated_at: new Date(Date.now() - 120_000).toISOString(),
          },
        },
      },
    ]);

    expect(stale).toHaveLength(1);
    expect(stale[0].status).toBe('processing');
  });

  it('ignores fresh in-flight processing', () => {
    const stale = pickStaleFiles([
      {
        id: 'f4',
        status: 'processing',
        metadata: {
          processing_progress: {
            stage: 'embedding',
            percent: 40,
            label: 'Indexing',
            updated_at: new Date().toISOString(),
          },
        },
      },
    ]);

    expect(stale).toHaveLength(0);
  });
});
