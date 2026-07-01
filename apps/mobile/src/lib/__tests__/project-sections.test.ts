import { describe, expect, it } from 'vitest';
import {
  PROJECT_SECTIONS,
  activeProjectSection,
  projectSectionPath,
  projectSectionPathByKey,
  resolveProjectSectionBack,
  resolveProjectSectionNavigation,
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

  it('builds paths by section key', () => {
    expect(projectSectionPathByKey('abc', 'timeline')).toBe('/project/abc/timeline');
    expect(projectSectionPathByKey('abc', 'overview')).toBe('/project/abc');
  });

  it('replaces the current section instead of stacking pills', () => {
    expect(resolveProjectSectionNavigation('abc', 'timeline', 'overview')).toEqual({
      kind: 'replace',
      path: '/project/abc/timeline',
    });
    expect(resolveProjectSectionNavigation('abc', 'ask-sunny', 'timeline')).toEqual({
      kind: 'replace',
      path: '/project/abc/ask-sunny',
    });
    expect(resolveProjectSectionNavigation('abc', 'timeline', 'timeline')).toEqual({ kind: 'noop' });
  });

  it('returns to overview before exiting the project', () => {
    expect(resolveProjectSectionBack('abc', 'timeline')).toEqual({
      kind: 'replace',
      path: '/project/abc',
    });
    expect(resolveProjectSectionBack('abc', 'overview')).toEqual({ kind: 'exit' });
  });
});
