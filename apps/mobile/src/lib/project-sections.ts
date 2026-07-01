import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type ProjectSectionKey =
  | 'overview'
  | 'files'
  | 'timeline'
  | 'ask-sunny'
  | 'critical-items'
  | 'follow-up';

export type ProjectSection = {
  key: ProjectSectionKey;
  label: string;
  segment: string;
  icon: ComponentProps<typeof Ionicons>['name'];
};

export const PROJECT_SECTIONS: ProjectSection[] = [
  { key: 'overview', label: 'Overview', segment: '', icon: 'grid-outline' },
  { key: 'files', label: 'Files', segment: 'files', icon: 'document-text-outline' },
  { key: 'timeline', label: 'Timeline', segment: 'timeline', icon: 'time-outline' },
  { key: 'ask-sunny', label: 'Sunny', segment: 'ask-sunny', icon: 'sunny-outline' },
  { key: 'critical-items', label: 'Critical', segment: 'critical-items', icon: 'warning-outline' },
  { key: 'follow-up', label: 'Follow Up', segment: 'follow-up', icon: 'mail-outline' },
];

export function projectOverviewPath(projectId: string): string {
  return `/project/${projectId}`;
}

export function projectSectionPath(projectId: string, section: ProjectSection): string {
  return section.segment ? `/project/${projectId}/${section.segment}` : projectOverviewPath(projectId);
}

export function projectSectionPathByKey(projectId: string, key: ProjectSectionKey): string {
  const section = PROJECT_SECTIONS.find((item) => item.key === key);
  if (!section) return projectOverviewPath(projectId);
  return projectSectionPath(projectId, section);
}

export function resolveProjectSectionNavigation(
  projectId: string,
  targetSection: ProjectSectionKey,
  activeSection: ProjectSectionKey
): { kind: 'noop' } | { kind: 'navigate'; path: string } {
  if (targetSection === activeSection) return { kind: 'noop' };
  return { kind: 'navigate', path: projectSectionPathByKey(projectId, targetSection) };
}

export function resolveProjectSectionBack(
  projectId: string,
  activeSection: ProjectSectionKey
): { kind: 'exit' } | { kind: 'navigate'; path: string } {
  if (activeSection === 'overview') return { kind: 'exit' };
  return { kind: 'navigate', path: projectOverviewPath(projectId) };
}

export function activeProjectSection(segments: string[]): ProjectSectionKey {
  const projectIndex = segments.indexOf('project');
  const sectionSegment = projectIndex >= 0 ? segments[projectIndex + 2] : undefined;
  if (!sectionSegment) return 'overview';
  const match = PROJECT_SECTIONS.find((section) => section.segment === sectionSegment);
  return match?.key ?? 'overview';
}
