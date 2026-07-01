import { describe, expect, it } from 'vitest';
import {
  PROJECT_SECTIONS,
  activeProjectSection,
  projectSectionPath,
} from '../project-sections';

describe('PROJECT_SECTIONS', () => {
  it('lists only the mobile project nav pills', () => {
    expect(PROJECT_SECTIONS.map((section) => section.key)).toEqual([
      'overview',
      'files',
      'timeline',
      'ask-sunny',
      'critical-items',
      'follow-up',
    ]);
  });

  it('builds section paths', () => {
    const overview = PROJECT_SECTIONS[0]!;
    const files = PROJECT_SECTIONS[1]!;

    expect(projectSectionPath('abc', overview)).toBe('/project/abc');
    expect(projectSectionPath('abc', files)).toBe('/project/abc/files');
  });

  it('resolves the active section from route segments', () => {
    expect(activeProjectSection(['project', 'abc', 'timeline'])).toBe('timeline');
    expect(activeProjectSection(['project', 'abc', 'ask-sunny'])).toBe('ask-sunny');
    expect(activeProjectSection(['project', 'abc'])).toBe('overview');
    expect(activeProjectSection(['project', 'abc', 'deck'])).toBe('overview');
    expect(activeProjectSection(['project', 'abc', 'playbook'])).toBe('overview');
  });
});
