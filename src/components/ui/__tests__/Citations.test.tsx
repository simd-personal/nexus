import { describe, expect, it } from 'vitest';
import { searchResultsToCitations } from '@/components/ui/Citations';

describe('searchResultsToCitations', () => {
  it('defaults missing file names', () => {
    expect(
      searchResultsToCitations([
        {
          id: 'chunk-1',
          project_id: 'proj-1',
          file_id: 'file-1',
          chunk_index: 0,
          text: 'hello',
          metadata: {},
          match_reason: 'Keyword match',
        },
      ])
    ).toEqual([
      {
        file_id: 'file-1',
        file_name: 'Unknown file',
        source_type: undefined,
        snippet: '',
      },
    ]);
  });
});
