export type ProjectNavVisibility = {
  showTimeline: boolean;
  showCriticalItems: boolean;
};

export function isProjectSectionVisible(
  sectionKey: string,
  visibility: ProjectNavVisibility
): boolean {
  if (sectionKey === 'timeline') return visibility.showTimeline;
  if (sectionKey === 'critical-items') return visibility.showCriticalItems;
  return true;
}

export function filterProjectSections<T extends { key: string }>(
  sections: readonly T[],
  visibility: ProjectNavVisibility
): T[] {
  return sections.filter((section) => isProjectSectionVisible(section.key, visibility));
}
