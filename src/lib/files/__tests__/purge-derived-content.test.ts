import { describe, expect, it, vi } from 'vitest';
import {
  buildFilesByProject,
  pruneOrphanedEntities,
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
