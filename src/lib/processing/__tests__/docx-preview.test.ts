import { describe, expect, it } from 'vitest';
import { isDocxFile } from '@/lib/processing/docx-preview';

describe('isDocxFile', () => {
  it('detects docx by extension and mime type', () => {
    expect(isDocxFile('scope.docx', 'application/octet-stream')).toBe(true);
    expect(
      isDocxFile(
        'scope.bin',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
    ).toBe(true);
    expect(isDocxFile('scope.pdf', 'application/pdf')).toBe(false);
  });
});
