import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type ProjectSectionKey =
  | 'overview'
  | 'files'
  | 'timeline'
  | 'search'
  | 'ask-sunny'
  | 'deck'
  | 'critical-items'
  | 'playbook'
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
  { key: 'search', label: 'Search', segment: 'search', icon: 'search-outline' },
  { key: 'ask-sunny', label: 'Sunny', segment: 'ask-sunny', icon: 'sunny-outline' },
  { key: 'deck', label: 'Deck', segment: 'deck', icon: 'easel-outline' },
  { key: 'critical-items', label: 'Critical', segment: 'critical-items', icon: 'warning-outline' },
  { key: 'playbook', label: 'Playbook', segment: 'playbook', icon: 'book-outline' },
  { key: 'follow-up', label: 'Follow Up', segment: 'follow-up', icon: 'mail-outline' },
];

export function projectSectionPath(projectId: string, section: ProjectSection): string {
  return section.segment ? `/project/${projectId}/${section.segment}` : `/project/${projectId}`;
}

export function activeProjectSection(segments: string[]): ProjectSectionKey {
  const projectIndex = segments.indexOf('project');
  const sectionSegment = projectIndex >= 0 ? segments[projectIndex + 2] : undefined;
  if (!sectionSegment) return 'overview';
  const match = PROJECT_SECTIONS.find((section) => section.segment === sectionSegment);
  return match?.key ?? 'overview';
}
