import { describe, expect, it } from 'vitest';
import { sunnyUpdateStillValid } from '@/lib/files/purge-derived-content';

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
