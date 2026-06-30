import { describe, expect, it } from 'vitest';
import {
  isSupportImageContentType,
  isSupportImageFileName,
  MAX_SUPPORT_ATTACHMENT_BYTES,
  parseSupportAttachmentFromFormValue,
} from '@/lib/support/attachment';

describe('support attachment helpers', () => {
  it('accepts common screenshot file types', () => {
    expect(isSupportImageFileName('bug.png')).toBe(true);
    expect(isSupportImageFileName('screen.jpeg')).toBe(true);
    expect(isSupportImageContentType('image/webp')).toBe(true);
    expect(isSupportImageFileName('notes.pdf')).toBe(false);
  });

  it('returns none when no file is provided', async () => {
    await expect(parseSupportAttachmentFromFormValue(null)).resolves.toEqual({ kind: 'none' });
  });

  it('parses a valid image upload', async () => {
    const file = new File([new Uint8Array([137, 80, 78, 71])], 'dashboard-bug.png', {
      type: 'image/png',
    });

    const result = await parseSupportAttachmentFromFormValue(file);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.attachment.filename).toBe('dashboard-bug.png');
      expect(result.attachment.contentType).toBe('image/png');
      expect(result.attachment.buffer.length).toBe(4);
    }
  });

  it('rejects unsupported file types', async () => {
    const file = new File(['hello'], 'report.pdf', { type: 'application/pdf' });
    const result = await parseSupportAttachmentFromFormValue(file);
    expect(result).toEqual({
      kind: 'error',
      error: 'Screenshots must be an image (PNG, JPG, WEBP, GIF, or HEIC).',
    });
  });

  it('rejects images over the size limit', async () => {
    const file = new File([new Uint8Array(MAX_SUPPORT_ATTACHMENT_BYTES + 1)], 'huge.png', {
      type: 'image/png',
    });
    const result = await parseSupportAttachmentFromFormValue(file);
    expect(result.kind).toBe('error');
    if (result.kind === 'error') {
      expect(result.error).toContain('too large');
    }
  });
});
