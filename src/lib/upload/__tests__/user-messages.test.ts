import { describe, expect, it } from 'vitest';
import {
  formatUploadApiError,
  uploadSuccessMessage,
  UPLOAD_MAX_SIZE_HINT,
} from '@/lib/upload/user-messages';

describe('upload user messages', () => {
  it('formats rate-limit responses with retry timing', () => {
    const msg = formatUploadApiError(429, {
      error: 'Slow down!',
      cooldown: true,
      retry_after: 120,
    });
    expect(msg).toContain('Slow down!');
    expect(msg).toContain('2 minutes');
  });

  it('builds zip extraction success copy', () => {
    expect(
      uploadSuccessMessage({ count: 3, zipExtracted: true, archiveName: 'deck.zip' })
    ).toMatch(/Extracted 3 files/);
  });

  it('includes max size in 413 fallback', () => {
    expect(formatUploadApiError(413)).toContain(UPLOAD_MAX_SIZE_HINT);
  });
});
