import { describe, expect, it } from 'vitest';
import {
  getFileExtension,
  inferSourceType,
  isProcessable,
  SUPPORTED_EXTENSIONS,
} from '@/lib/constants';

describe('file constants', () => {
  it('includes markdown extensions as processable', () => {
    expect(SUPPORTED_EXTENSIONS).toContain('.md');
    expect(SUPPORTED_EXTENSIONS).toContain('.markdown');
    expect(isProcessable('notes.md')).toBe(true);
    expect(isProcessable('README.markdown')).toBe(true);
  });

  it('infers source types from file names', () => {
    expect(inferSourceType('brief.md', 'text/markdown')).toBe('note');
    expect(inferSourceType('report.pdf', 'application/pdf')).toBe('pdf');
    expect(inferSourceType('call-transcript.vtt', 'text/vtt')).toBe('transcript');
    expect(inferSourceType('Q3-deck-final.pdf')).toBe('deck');
    expect(inferSourceType('meeting-notes.txt')).toBe('meeting');
    expect(inferSourceType('recording.mp3')).toBe('audio');
    expect(inferSourceType('photo.png', 'image/png')).toBe('note');
  });

  it('extracts lowercase extensions', () => {
    expect(getFileExtension('Report.PDF')).toBe('.pdf');
    expect(getFileExtension('noextension')).toBe('');
  });

  it('marks unsupported extensions as not processable', () => {
    expect(isProcessable('archive.zip')).toBe(false);
    expect(isProcessable('slides.pptx')).toBe(false);
  });
});
