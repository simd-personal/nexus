import { beforeEach, describe, expect, it, vi } from 'vitest';
import { finalizeFileReplacement, summarizeReplacementDiff } from '@/lib/files/finalize-replacement';
import { computeTextDiff } from '@/lib/files/text-diff';

const mockStructuredExtraction = vi.fn();

vi.mock('@/lib/ai/openai', () => ({
  OPENAI_MODELS: { summary: 'gpt-test' },
  structuredExtraction: (...args: unknown[]) => mockStructuredExtraction(...args),
}));

describe('summarizeReplacementDiff', () => {
  beforeEach(() => {
    mockStructuredExtraction.mockReset();
  });

  it('returns AI summary from structured extraction', async () => {
    mockStructuredExtraction.mockResolvedValue({
      headline: 'Two issues completed, one new follow-up added.',
      what_changed: 'Portland staffing moved to done and finance review was removed.',
      completed_or_removed: ['Finance review'],
      newly_added: ['Client callback Friday'],
    });

    const diff = computeTextDiff('Finance review open', 'Client callback Friday open');
    const result = await summarizeReplacementDiff('tracker.docx', diff);

    expect(result.summary).toMatch(/Two issues completed/i);
    expect(result.ai_summary).toMatch(/Portland staffing/i);
  });
});

describe('finalizeFileReplacement', () => {
  beforeEach(() => {
    mockStructuredExtraction.mockResolvedValue({
      headline: 'Tracker refreshed.',
      what_changed: 'One item completed.',
      completed_or_removed: [],
      newly_added: [],
    });
  });

  it('stores revision, timeline event, and sunny update', async () => {
    const inserts: Array<{ table: string; payload: Record<string, unknown> }> = [];

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'file_revisions') {
          return {
            insert: vi.fn((payload: Record<string, unknown>) => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: { id: 'rev-1' }, error: null }),
              })),
            })),
          };
        }
        return {
          insert: vi.fn((payload: Record<string, unknown>) => {
            inserts.push({ table, payload });
            return Promise.resolve({ error: null });
          }),
        };
      }),
    } as never;

    const result = await finalizeFileReplacement({
      supabase,
      projectId: 'proj-1',
      fileId: 'file-1',
      fileName: 'tracker.docx',
      newText: 'Issue A done',
      pending: { previous_text: 'Issue A open', replaced_at: new Date().toISOString() },
      projectName: 'EPIC Program',
    });

    expect(result?.revisionId).toBe('rev-1');
    expect(inserts.some((entry) => entry.table === 'timeline_events')).toBe(true);
    expect(inserts.some((entry) => entry.table === 'sunny_updates')).toBe(true);
  });
});
