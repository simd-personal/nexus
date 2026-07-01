import { describe, expect, it } from 'vitest';
import { resolveDataSecuritySections } from '../data-security';

describe('resolveDataSecuritySections', () => {
  it('includes the base section for all users', () => {
    const sections = resolveDataSecuritySections('all');
    expect(sections).toHaveLength(1);
    expect(sections[0]?.title).toBe('How your files are protected');
  });

  it('adds Pro context without replacing base protections', () => {
    const sections = resolveDataSecuritySections('pro');
    expect(sections).toHaveLength(2);
    expect(sections[1]?.title).toBe('Pro data handling');
  });

  it('adds enterprise safeguards', () => {
    const sections = resolveDataSecuritySections('enterprise');
    expect(sections).toHaveLength(2);
    expect(sections[1]?.title).toBe('Enterprise safeguards');
  });
});
