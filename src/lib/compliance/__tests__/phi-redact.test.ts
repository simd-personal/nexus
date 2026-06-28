import { describe, expect, it } from 'vitest';
import { redactPhi, redactPhiPages } from '@/lib/compliance/phi-redact';

describe('redactPhi', () => {
  it('redacts common PHI patterns', () => {
    const input = [
      'Patient: Jane Doe',
      'MRN: ABC-12345',
      'DOB: 03/15/1980',
      'Phone: (555) 123-4567',
      'Email: jane.doe@example.com',
      'SSN: 123-45-6789',
    ].join('\n');

    const result = redactPhi(input);
    expect(result.redactionCount).toBeGreaterThan(0);
    expect(result.text).not.toContain('jane.doe@example.com');
    expect(result.text).not.toContain('123-45-6789');
    expect(result.text).toContain('[REDACTED-PATIENT]');
    expect(result.categories.length).toBeGreaterThan(0);
  });

  it('leaves non-sensitive business content intact', () => {
    const input = 'Q3 revenue increased 12 percent across all regions.';
    const result = redactPhi(input);
    expect(result.redactionCount).toBe(0);
    expect(result.text).toBe(input);
  });

  it('redacts page arrays for PDF processing', () => {
    const { pages, redactionCount } = redactPhiPages([
      { pageNumber: 1, text: 'Patient: John Smith\nMRN: 998877' },
      { pageNumber: 2, text: 'Operational metrics only.' },
    ]);
    expect(redactionCount).toBeGreaterThan(0);
    expect(pages[0].text).toContain('[REDACTED-PATIENT]');
    expect(pages[1].text).toBe('Operational metrics only.');
  });
});
