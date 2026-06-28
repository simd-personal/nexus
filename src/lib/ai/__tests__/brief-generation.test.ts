import { describe, expect, it } from 'vitest';
import { validateBriefProse } from '@/lib/ai/brief-validation';

describe('validateBriefProse', () => {
  const clean = `Executive Summary

Acme Corp Q3 review focused on west region expansion. Revenue is up 12 percent.

Critical Items

The ROI model must be completed before the executive sync. Maria Santos owns the vendor cutover plan due July 15.`;

  it('accepts clean prose briefs', () => {
    expect(validateBriefProse(clean)).toEqual([]);
  });

  it('rejects markdown headings', () => {
    expect(validateBriefProse('## Executive Summary\n\nText ' + 'x'.repeat(100))).toContain(
      'markdown headings (##)'
    );
  });

  it('rejects citation brackets', () => {
    expect(validateBriefProse(clean.replace('expansion.', 'expansion [4].'))).toContain(
      'citation brackets [n]'
    );
  });

  it('rejects messy list formatting', () => {
    expect(
      validateBriefProse(
        'Executive Summary\n\nItem one [4].,Item two [5]. ' + 'x'.repeat(100)
      )
    ).toContain('messy ". ," list formatting');
  });
});
