import { describe, expect, it } from 'vitest';
import { findProjectFileByUploadName } from '@/lib/upload/name-matching';

describe('upload collision matching', () => {
  it('finds the existing project file for a duplicate upload name', () => {
    const existing = findProjectFileByUploadName(
      [
        { id: 'a', file_name: 'Issue-Tracker-LIVE.docx' },
        { id: 'b', file_name: 'meeting-notes.txt' },
      ],
      'issue-tracker-live.docx'
    );

    expect(existing?.id).toBe('a');
  });

  it('does not collide with different filenames', () => {
    const existing = findProjectFileByUploadName(
      [{ id: 'a', file_name: 'Issue-Tracker-LIVE.docx' }],
      '2026-06-29-meeting-notes.txt'
    );

    expect(existing).toBeNull();
  });
});
