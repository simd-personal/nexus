import { describe, expect, it } from 'vitest';
import { filterProjectSections, isProjectSectionVisible } from '../project-nav';

describe('project-nav visibility', () => {
  const sections = [
    { key: 'overview', label: 'Overview' },
    { key: 'files', label: 'Files' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'critical-items', label: 'Critical' },
  ] as const;

  it('hides timeline and critical items when empty', () => {
    const visibility = { showTimeline: false, showCriticalItems: false };
    expect(filterProjectSections(sections, visibility).map((section) => section.key)).toEqual([
      'overview',
      'files',
    ]);
  });

  it('shows optional tabs when material exists', () => {
    const visibility = { showTimeline: true, showCriticalItems: true };
    expect(isProjectSectionVisible('timeline', visibility)).toBe(true);
    expect(isProjectSectionVisible('critical-items', visibility)).toBe(true);
    expect(filterProjectSections(sections, visibility)).toHaveLength(4);
  });
});
