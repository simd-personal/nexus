import { describe, expect, it } from 'vitest';
import { resolveOnboardingStep, needsOnboarding } from '@/lib/onboarding/status';
import type { ProjectWithStats } from '@/types/database';

function project(overrides: Partial<ProjectWithStats> = {}): ProjectWithStats {
  return {
    id: 'p1',
    owner_id: 'u1',
    organization_id: null,
    parent_project_id: null,
    client_name: 'Acme',
    project_name: 'Q3 review',
    description: null,
    status: 'healthy',
    last_summary: null,
    last_activity_at: null,
    inbound_token: null,
    watch_keywords: [],
    my_role: null,
    portfolio: 'work',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    file_count: 0,
    meeting_count: 0,
    email_count: 0,
    critical_item_count: 0,
    action_item_count: 0,
    last_sunny_update: null,
    ...overrides,
  };
}

describe('resolveOnboardingStep', () => {
  it('starts at project when none exist', () => {
    expect(resolveOnboardingStep({ projects: [] }).step).toBe('project');
  });

  it('moves to upload when project has no files', () => {
    const state = resolveOnboardingStep({ projects: [project()] });
    expect(state.step).toBe('upload');
    expect(state.project?.id).toBe('p1');
  });

  it('marks complete once files exist, even while processing', () => {
    const state = resolveOnboardingStep({
      projects: [project({ file_count: 1 })],
      recentFile: { id: 'f1', status: 'processing' },
    });
    expect(state.step).toBe('complete');
    expect(state.activeFileId).toBe('f1');
  });

  it('marks complete when latest file is processed', () => {
    const state = resolveOnboardingStep({
      projects: [project({ file_count: 1, last_summary: 'Brief ready' })],
      recentFile: { id: 'f1', status: 'processed' },
    });
    expect(state.step).toBe('complete');
  });
});

describe('needsOnboarding', () => {
  it('is true only when the user has no projects', () => {
    expect(needsOnboarding([])).toBe(true);
    expect(needsOnboarding([project()])).toBe(false);
    expect(needsOnboarding([project({ file_count: 2 })])).toBe(false);
  });

  it('does not force onboarding when the first project is empty but others have files', () => {
    expect(
      needsOnboarding([
        project({ id: 'empty', file_count: 0 }),
        project({ id: 'ready', file_count: 3 }),
      ])
    ).toBe(false);
  });
});
