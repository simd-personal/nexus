import type { ProjectWithStats } from '@/types/database';

export type OnboardingStep = 'project' | 'upload' | 'processing' | 'complete';

export interface OnboardingState {
  step: OnboardingStep;
  project: ProjectWithStats | null;
  /** Most recent file id when upload/processing steps apply. */
  activeFileId: string | null;
  fileCount: number;
}

const TERMINAL_FILE_STATUSES = new Set(['processed', 'watch', 'critical']);

export function resolveOnboardingStep(input: {
  projects: ProjectWithStats[];
  recentFile?: { id: string; status: string } | null;
}): OnboardingState {
  const project = input.projects[0] ?? null;
  const fileCount = project?.file_count ?? 0;

  if (!project) {
    return { step: 'project', project: null, activeFileId: null, fileCount: 0 };
  }

  if (fileCount === 0) {
    return { step: 'upload', project, activeFileId: null, fileCount: 0 };
  }

  const file = input.recentFile;
  if (file && !TERMINAL_FILE_STATUSES.has(file.status)) {
    return { step: 'processing', project, activeFileId: file.id, fileCount };
  }

  return { step: 'complete', project, activeFileId: file?.id ?? null, fileCount };
}

export function needsOnboarding(projects: ProjectWithStats[]): boolean {
  if (projects.length === 0) return true;
  const primary = projects[0];
  return (primary?.file_count ?? 0) === 0;
}
