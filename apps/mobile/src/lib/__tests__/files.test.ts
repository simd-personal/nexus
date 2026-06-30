import { describe, expect, it } from 'vitest';
import { findFileByUploadName, normalizeUploadFileName } from '../files';

describe('mobile file name helpers', () => {
  it('normalizes upload file names', () => {
    expect(normalizeUploadFileName(' Brief.PDF ')).toBe('brief.pdf');
  });

  it('finds existing files by upload name', () => {
    const files = [
      {
        id: '1',
        file_name: 'Q3 Review.pdf',
        project_id: 'p1',
        file_type: 'application/pdf',
        source_type: 'upload',
        status: 'processed',
        created_at: '',
        user_note: null,
      },
      {
        id: '2',
        file_name: 'notes.md',
        project_id: 'p1',
        file_type: 'text/markdown',
        source_type: 'upload',
        status: 'processed',
        created_at: '',
        user_note: null,
      },
    ];
    expect(findFileByUploadName(files, 'q3 review.pdf')?.id).toBe('1');
    expect(findFileByUploadName(files, 'other.docx')).toBeNull();
  });
});
