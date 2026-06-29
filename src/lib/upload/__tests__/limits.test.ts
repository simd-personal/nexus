import { describe, expect, it } from 'vitest';
import {
  MAX_PASTED_TEXT_BYTES,
  MAX_SINGLE_UPLOAD_BYTES,
  uploadRateLimitForPro,
  validateUploadByteSize,
} from '@/lib/upload/limits';

describe('upload limits', () => {
  it('allows files up to 100 MB', () => {
    expect(validateUploadByteSize(MAX_SINGLE_UPLOAD_BYTES, 'file').ok).toBe(true);
    expect(validateUploadByteSize(MAX_SINGLE_UPLOAD_BYTES + 1, 'file').ok).toBe(false);
  });

  it('allows pasted text up to 2 MB', () => {
    expect(validateUploadByteSize(MAX_PASTED_TEXT_BYTES, 'paste').ok).toBe(true);
    expect(validateUploadByteSize(MAX_PASTED_TEXT_BYTES + 1, 'paste').ok).toBe(false);
  });

  it('gives pro users a higher upload rate ceiling', () => {
    expect(uploadRateLimitForPro(false).max).toBe(30);
    expect(uploadRateLimitForPro(true).max).toBe(120);
  });
});
