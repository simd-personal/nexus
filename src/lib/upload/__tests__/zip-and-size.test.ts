import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import {
  extractZipArchive,
  isZipFile,
  ZIP_MAX_ENTRIES,
} from '@/lib/upload/zip-extract';
import {
  getUploadSizeTier,
  uploadSizeHint,
  LARGE_UPLOAD_BYTES,
  VERY_LARGE_UPLOAD_BYTES,
} from '@/lib/upload/size-hints';

describe('isZipFile', () => {
  it('detects zip by extension and mime', () => {
    expect(isZipFile('bundle.zip')).toBe(true);
    expect(isZipFile('data.bin', 'application/zip')).toBe(true);
    expect(isZipFile('notes.pdf')).toBe(false);
  });
});

describe('extractZipArchive', () => {
  it('extracts supported files and skips junk', async () => {
    const zip = new JSZip();
    zip.file('notes/meeting-notes.txt', 'Launch may slip to Q3');
    zip.file('deck.pdf', '%PDF-1.4 fake');
    zip.file('__MACOSX/._junk', 'x');
    zip.file('virus.exe', 'bad');
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });

    const result = await extractZipArchive(buffer);
    expect(result.entries.map((e) => e.name).sort()).toEqual(['deck.pdf', 'meeting-notes.txt']);
    expect(result.skipped.some((s) => s.includes('unsupported'))).toBe(true);
  });

  it('respects entry limit', async () => {
    const zip = new JSZip();
    for (let i = 0; i < ZIP_MAX_ENTRIES + 3; i++) {
      zip.file(`file-${i}.txt`, `content ${i}`);
    }
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    const result = await extractZipArchive(buffer);
    expect(result.entries.length).toBe(ZIP_MAX_ENTRIES);
    expect(result.skipped.length).toBeGreaterThan(0);
  });
});

describe('upload size hints', () => {
  it('classifies tiers', () => {
    expect(getUploadSizeTier(1024)).toBe('normal');
    expect(getUploadSizeTier(LARGE_UPLOAD_BYTES)).toBe('large');
    expect(getUploadSizeTier(VERY_LARGE_UPLOAD_BYTES)).toBe('very_large');
  });

  it('returns user-facing copy for large tiers', () => {
    expect(uploadSizeHint('normal')).toBeNull();
    expect(uploadSizeHint('large')).toContain('few minutes');
    expect(uploadSizeHint('very_large')).toContain('several minutes');
  });
});
