import { describe, expect, it } from 'vitest';
import { isImageFileName } from '@/components/project/PhotoCaptureUpload';

describe('isImageFileName', () => {
  it('detects common photo extensions', () => {
    expect(isImageFileName('kickoff.jpg')).toBe(true);
    expect(isImageFileName('notes.PNG')).toBe(true);
    expect(isImageFileName('brief.md')).toBe(false);
  });
});
