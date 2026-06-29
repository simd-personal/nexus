import { describe, expect, it } from 'vitest';
import { pickLatestChatSession } from '@/lib/data/queries';
import type { ChatMessage, ChatSession } from '@/types/database';

function session(id: string, updatedAt: string): ChatSession {
  return {
    id,
    owner_id: 'user-1',
    title: 'Chat',
    project_id: 'proj-1',
    session_type: 'search',
    created_at: updatedAt,
    updated_at: updatedAt,
  };
}

function withMessages(id: string, updatedAt: string): { session: ChatSession; messages: ChatMessage[] } {
  return {
    session: session(id, updatedAt),
    messages: [
      {
        id: `m-${id}`,
        session_id: id,
        project_id: 'proj-1',
        role: 'user',
        content: 'hello',
        citations: [],
        metadata: {},
        created_at: updatedAt,
      },
    ],
  };
}

describe('pickLatestChatSession', () => {
  it('returns the only session when one side is null', () => {
    const latest = withMessages('search-1', '2026-06-28T12:00:00Z');
    expect(pickLatestChatSession(latest, null)).toEqual(latest);
    expect(pickLatestChatSession(null, latest)).toEqual(latest);
  });

  it('prefers the more recently updated session', () => {
    const search = withMessages('search-1', '2026-06-28T12:00:00Z');
    const project = withMessages('project-1', '2026-06-28T13:00:00Z');
    expect(pickLatestChatSession(search, project)?.session.id).toBe('project-1');
    expect(pickLatestChatSession(project, search)?.session.id).toBe('project-1');
  });
});
