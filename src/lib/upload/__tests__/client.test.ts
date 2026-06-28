import { describe, expect, it } from 'vitest';
import {
  getFilesFromDataTransfer,
  isFileDragEvent,
} from '@/lib/upload/client';

describe('file drag helpers', () => {
  it('detects file drags from DataTransfer types', () => {
    const event = {
      dataTransfer: { types: ['Files'] },
    } as DragEvent;

    expect(isFileDragEvent(event)).toBe(true);
  });

  it('ignores non-file drags', () => {
    const event = {
      dataTransfer: { types: ['text/plain'] },
    } as DragEvent;

    expect(isFileDragEvent(event)).toBe(false);
  });

  it('reads dropped files from DataTransfer.files', () => {
    const file = new File(['# Notes'], 'brief.md', { type: 'text/markdown' });
    const dataTransfer = {
      files: [file],
      items: [],
    } as unknown as DataTransfer;

    expect(getFilesFromDataTransfer(dataTransfer)).toHaveLength(1);
    expect(getFilesFromDataTransfer(dataTransfer)[0].name).toBe('brief.md');
  });

  it('sanitizes unsafe upload file names', async () => {
    const { sanitizeUploadFileName } = await import('@/lib/upload/client');
    expect(sanitizeUploadFileName('../notes/readme.md')).toBe('readme.md');
    expect(sanitizeUploadFileName('')).toBe('upload');
  });
});
