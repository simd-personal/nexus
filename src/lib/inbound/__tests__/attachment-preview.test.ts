import { describe, expect, it } from 'vitest';
import { formatAttachmentSize, getInboundAttachmentViewType } from '@/lib/inbound/attachment-preview';

describe('getInboundAttachmentViewType', () => {
  it('classifies images, PDFs, text, and downloads', () => {
    expect(getInboundAttachmentViewType('image/png', 'photo.png')).toBe('image');
    expect(getInboundAttachmentViewType('application/pdf', 'report.pdf')).toBe('pdf');
    expect(getInboundAttachmentViewType('application/octet-stream', 'notes.txt')).toBe('text');
    expect(getInboundAttachmentViewType('application/vnd.ms-excel', 'sheet.xlsx')).toBe('download');
  });
});

describe('formatAttachmentSize', () => {
  it('formats bytes, kilobytes, and megabytes', () => {
    expect(formatAttachmentSize(512)).toBe('512 B');
    expect(formatAttachmentSize(2048)).toBe('2.0 KB');
    expect(formatAttachmentSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });
});
