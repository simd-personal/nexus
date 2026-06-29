import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ProjectWithStats } from '@/types/database';

const captured = vi.hoisted(() => ({
  props: null as Record<string, unknown> | null,
}));

const searchParamsState = vi.hoisted(() => ({
  value: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => searchParamsState.value,
}));

vi.mock('next/dynamic', () => ({
  default: () =>
    function CapturingSunnyChat(props: Record<string, unknown>) {
      captured.props = props;
      return null;
    },
}));

import { GlobalChatPageClient } from '@/components/search/SearchPageClient';

function project(partial: Partial<ProjectWithStats> & Pick<ProjectWithStats, 'id'>): ProjectWithStats {
  return {
    owner_id: 'user-1',
    organization_id: null,
    client_name: 'Acme',
    project_name: 'Program',
    description: null,
    status: 'healthy',
    last_summary: null,
    last_activity_at: null,
    inbound_token: null,
    parent_project_id: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    file_count: 0,
    meeting_count: 0,
    email_count: 0,
    action_item_count: 0,
    critical_item_count: 0,
    last_sunny_update: null,
    watch_keywords: [],
    ...partial,
  };
}

const projects: ProjectWithStats[] = [
  project({
    id: 'program',
    project_name: 'HQ Relocation',
    sub_projects: [
      project({ id: 'ws-a', project_name: 'Site rollout', parent_project_id: 'program' }),
    ],
    sub_project_count: 1,
  }),
];

describe('GlobalChatPageClient', () => {
  beforeEach(() => {
    captured.props = null;
    searchParamsState.value = new URLSearchParams();
  });

  it('initializes chat scope from ?project= sidebar links', () => {
    searchParamsState.value = new URLSearchParams('project=ws-a');

    renderToStaticMarkup(
      <GlobalChatPageClient userId="user-1" projects={projects} />
    );

    const scope = captured.props?.chatScope as
      | { kind: 'selected'; projectIds: string[]; labels: string[] }
      | { kind: 'all' };

    expect(scope?.kind).toBe('selected');
    if (scope?.kind === 'selected') {
      expect(scope.projectIds).toEqual(['ws-a']);
      expect(scope.labels).toEqual(['Acme · Site rollout']);
    }
  });

  it('defaults to all projects when no project query param is present', () => {
    renderToStaticMarkup(
      <GlobalChatPageClient userId="user-1" projects={projects} />
    );

    expect(captured.props?.chatScope).toEqual({ kind: 'all' });
  });
});
