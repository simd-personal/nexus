import type { ProjectWithStats } from '@/types/database';

export type OnboardingStep = 'project' | 'upload' | 'processing' | 'complete';

export interface OnboardingState {
  step: OnboardingStep;
  project: ProjectWithStats | null;
  /** Most recent file id when upload/processing steps apply. */
  activeFileId: string | null;
  fileCount: number;
}

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

  // Files exist — onboarding is done; processing continues in the background.
  return {
    step: 'complete',
    project,
    activeFileId: input.recentFile?.id ?? null,
    fileCount,
  };
}

export function needsOnboarding(projects: ProjectWithStats[]): boolean {
  // Only brand-new users with no projects — empty projects are valid; upload can happen from the project itself.
  return projects.length === 0;
}
