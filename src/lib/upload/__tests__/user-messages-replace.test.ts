import { describe, expect, it } from 'vitest';
import { replaceSuccessMessage, uploadBatchSuccessMessage } from '@/lib/upload/user-messages';

describe('upload user messages', () => {
  it('describes a single replaced file', () => {
    expect(replaceSuccessMessage('Issue-Tracker-LIVE.docx')).toMatch(/summarize what changed/i);
  });

  it('combines replaced and uploaded messages', () => {
    const message = uploadBatchSuccessMessage({
      uploaded: ['notes.txt'],
      replaced: ['Issue-Tracker-LIVE.docx'],
    });

    expect(message).toMatch(/Replaced Issue-Tracker-LIVE.docx/i);
    expect(message).toMatch(/File uploaded/i);
  });
});
