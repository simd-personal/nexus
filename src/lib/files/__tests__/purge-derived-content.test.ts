import { describe, expect, it, vi } from 'vitest';
import {
  buildFilesByProject,
  pruneOrphanedEntities,
  removeSunnyUpdatesForFile,
  sunnyUpdateStillValid,
} from '@/lib/files/purge-derived-content';

describe('sunnyUpdateStillValid', () => {
  const filesByProject = new Map<string, Set<string>>([
    ['proj-1', new Set(['brief.pdf', 'notes.md'])],
  ]);

  it('keeps updates when a cited file still exists', () => {
    expect(
      sunnyUpdateStillValid(
        {
          project_id: 'proj-1',
          source_citations: [{ file_name: 'brief.pdf', snippet: 'x' }],
        },
        filesByProject
      )
    ).toBe(true);
  });

  it('drops updates when cited files were removed', () => {
    expect(
      sunnyUpdateStillValid(
        {
          project_id: 'proj-1',
          source_citations: [
            { file_name: 'HBMC_Credentialing_Search_Tool_06.01.2026 (1).xlsx', snippet: 'x' },
          ],
        },
        filesByProject
      )
    ).toBe(false);
  });

  it('keeps updates without citations', () => {
    expect(
      sunnyUpdateStillValid({ project_id: 'proj-1', source_citations: [] }, filesByProject)
    ).toBe(true);
  });
});

describe('removeSunnyUpdatesForFile', () => {
  it('deletes prior updates that cite the same file', async () => {
    const deleteIn = vi.fn().mockResolvedValue({ error: null });
    const eq = vi.fn().mockReturnValue({
      data: [
        { id: 'update-1', source_citations: [{ file_id: 'file-1', file_name: 'doc.pdf' }] },
        { id: 'update-2', source_citations: [{ file_id: 'file-2', file_name: 'other.pdf' }] },
      ],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ eq });
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'sunny_updates') {
          return { select, delete: vi.fn().mockReturnValue({ in: deleteIn }) };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    };

    await removeSunnyUpdatesForFile(supabase as never, 'proj-1', 'file-1', 'doc.pdf');

    expect(deleteIn).toHaveBeenCalledWith('id', ['update-1']);
  });
});

describe('pruneOrphanedEntities', () => {
  it('deletes entities with no source file, scoped to project when provided', async () => {
    const deleteChain = {
      is: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ error: null }),
    };
    deleteChain.is.mockReturnValue(deleteChain);
    deleteChain.eq.mockResolvedValue({ error: null });

    const supabase = {
      from: vi.fn().mockReturnValue({ delete: vi.fn().mockReturnValue(deleteChain) }),
    };

    await pruneOrphanedEntities(supabase as never, ['proj-1']);

    expect(supabase.from).toHaveBeenCalledWith('entities');
    expect(deleteChain.is).toHaveBeenCalledWith('source_file_id', null);
    expect(deleteChain.eq).toHaveBeenCalledWith('project_id', 'proj-1');
  });
});
