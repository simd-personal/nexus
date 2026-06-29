import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChatScopeChips, ChatScopePicker } from '@/components/chat/ChatScopePicker';
import {
  ALL_PROJECTS_SCOPE,
  buildChatScope,
  initialScopeForProject,
  type ChatScope,
} from '@/lib/chat/scope';
import type { ProjectWithStats } from '@/types/database';

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

const tree: ProjectWithStats[] = [
  project({
    id: 'program',
    project_name: 'HQ Relocation',
    sub_projects: [
      project({ id: 'ws-a', project_name: 'Site rollout', parent_project_id: 'program' }),
      project({ id: 'ws-b', project_name: 'HQ planning', parent_project_id: 'program' }),
    ],
    sub_project_count: 2,
  }),
  project({ id: 'solo', client_name: 'Beta', project_name: 'Strategy' }),
];

describe('ChatScopeChips', () => {
  it('renders all-projects chip when scope is global', () => {
    const html = renderToStaticMarkup(
      <ChatScopeChips scope={ALL_PROJECTS_SCOPE} projects={tree} />
    );
    expect(html).toContain('All projects');
  });

  it('renders selected scope labels as chips', () => {
    const scope = buildChatScope(tree, new Set(['ws-a']));
    const html = renderToStaticMarkup(<ChatScopeChips scope={scope} projects={tree} />);
    expect(html).toContain('Acme · Site rollout');
  });

  it('omits remove buttons when scope is locked', () => {
    const scope = initialScopeForProject(tree, 'program');
    const html = renderToStaticMarkup(
      <ChatScopeChips scope={scope} projects={tree} lockScope />
    );
    expect(html).toContain('all workstreams');
    expect(html).not.toContain('aria-label="Remove');
  });
});

describe('ChatScopePicker', () => {
  it('renders scope summary trigger for editable scope', () => {
    const html = renderToStaticMarkup(
      <ChatScopePicker
        projects={tree}
        scope={ALL_PROJECTS_SCOPE}
        onScopeChange={() => {}}
      />
    );
    expect(html).toContain('All projects');
  });

  it('hides trigger when scope is locked', () => {
    const scope = initialScopeForProject(tree, 'solo');
    const html = renderToStaticMarkup(
      <ChatScopePicker
        projects={tree}
        scope={scope}
        onScopeChange={() => {}}
        lockScope
      />
    );
    expect(html).not.toContain('All projects');
  });
});

describe('multi-project scope selection', () => {
  it('combines multiple standalone projects', () => {
    const scope = buildChatScope(tree, new Set(['solo', 'ws-a']));
    expect(scope.kind).toBe('selected');
    if (scope.kind === 'selected') {
      expect(scope.projectIds.sort()).toEqual(['solo', 'ws-a'].sort());
      expect(scope.labels).toContain('Beta · Strategy');
      expect(scope.labels).toContain('Acme · Site rollout');
    }
  });

  it('supports mixed program and standalone selection from URL ids', () => {
    const scope = buildChatScope(
      tree,
      new Set(['program', 'ws-a', 'ws-b', 'solo'])
    );
    if (scope.kind === 'selected') {
      expect(scope.projectIds).toContain('solo');
      expect(scope.projectIds).toContain('program');
    }
  });
});
