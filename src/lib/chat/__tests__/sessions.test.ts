import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  deleteLastAssistantMessage,
  getOrCreateSession,
  saveChatMessage,
} from '@/lib/chat/sessions';

function createSessionMock(handlers: {
  existing?: { id: string; title: string | null } | null;
  inserted?: { id: string; title: string | null } | null;
  afterRace?: { id: string; title: string | null } | null;
  insertError?: boolean;
}) {
  const insert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
        data: handlers.insertError ? null : handlers.inserted ?? null,
        error: handlers.insertError ? { message: 'duplicate' } : null,
      }),
    }),
  });

  let selectCall = 0;
  const maybeSingle = vi.fn().mockImplementation(async () => {
    selectCall += 1;
    if (selectCall === 1) {
      return { data: handlers.existing ?? null, error: null };
    }
    return { data: handlers.afterRace ?? null, error: null };
  });

  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    insert,
    maybeSingle,
    single: vi.fn().mockResolvedValue({
      data: handlers.inserted ?? { id: 'new-id', title: 'New conversation' },
      error: null,
    }),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
  };

  const supabase = {
    from: vi.fn(() => chain),
    _chain: chain,
    _insert: insert,
    _maybeSingle: maybeSingle,
  } as unknown as SupabaseClient & {
    _insert: ReturnType<typeof vi.fn>;
    _maybeSingle: ReturnType<typeof vi.fn>;
  };

  return supabase;
}

describe('chat sessions', () => {
  it('reuses an existing client-provided session id', async () => {
    const supabase = createSessionMock({
      existing: { id: 'session-1', title: 'Existing chat' },
    });

    const session = await getOrCreateSession(supabase, 'user-1', {
      sessionId: 'session-1',
      sessionType: 'project',
      projectId: 'proj-1',
      title: 'Ignored title',
    });

    expect(session.id).toBe('session-1');
    expect(supabase._insert).not.toHaveBeenCalled();
  });

  it('creates a session when client id is new', async () => {
    const supabase = createSessionMock({
      existing: null,
      inserted: { id: 'session-new', title: 'Ask about Denver' },
    });

    const session = await getOrCreateSession(supabase, 'user-1', {
      sessionId: 'session-new',
      sessionType: 'project',
      projectId: 'proj-1',
      title: 'Ask about Denver',
    });

    expect(session.id).toBe('session-new');
    expect(supabase._insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'session-new',
        owner_id: 'user-1',
        project_id: 'proj-1',
        session_type: 'project',
      })
    );
  });

  it('recovers from a create race by reading the session back', async () => {
    const supabase = createSessionMock({
      existing: null,
      insertError: true,
      afterRace: { id: 'session-race', title: 'Race winner' },
    });

    const session = await getOrCreateSession(supabase, 'user-1', {
      sessionId: 'session-race',
      sessionType: 'search',
    });

    expect(session.id).toBe('session-race');
    expect(supabase._maybeSingle).toHaveBeenCalledTimes(2);
  });

  it('deletes the latest assistant message for regenerate', async () => {
    const del = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ id: 'msg-99' }] }),
        delete: vi.fn(() => ({ eq: del })),
      })),
    } as unknown as SupabaseClient;

    await deleteLastAssistantMessage(supabase, 'session-1');
    expect(del).toHaveBeenCalledWith('id', 'msg-99');
  });

  it('persists chat messages', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn(() => ({ insert })),
    } as unknown as SupabaseClient;

    await saveChatMessage(supabase, {
      session_id: 'session-1',
      project_id: 'proj-1',
      role: 'user',
      content: 'What changed in Denver?',
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: 'session-1',
        role: 'user',
        content: 'What changed in Denver?',
      })
    );
  });
});
