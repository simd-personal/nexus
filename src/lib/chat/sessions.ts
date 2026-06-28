import type { SupabaseClient } from '@supabase/supabase-js';

export async function getOrCreateSession(
  supabase: SupabaseClient,
  userId: string,
  opts: {
    sessionId?: string;
    sessionType: 'project' | 'search';
    projectId?: string | null;
    title?: string;
  }
): Promise<{ id: string; title: string | null }> {
  const title = opts.title?.slice(0, 80) ?? 'New conversation';

  // The client owns the session id, so creation is idempotent: an existing id
  // is reused, and a new id is created exactly once (no duplicate chats).
  if (opts.sessionId) {
    const existing = await supabase
      .from('chat_sessions')
      .select('id, title')
      .eq('id', opts.sessionId)
      .eq('owner_id', userId)
      .maybeSingle();
    if (existing.data) return existing.data;

    const created = await supabase
      .from('chat_sessions')
      .insert({
        id: opts.sessionId,
        owner_id: userId,
        project_id: opts.projectId ?? null,
        session_type: opts.sessionType,
        title,
      })
      .select('id, title')
      .maybeSingle();
    if (created.data) return created.data;

    // Lost a create race (row already exists) — read it back.
    const again = await supabase
      .from('chat_sessions')
      .select('id, title')
      .eq('id', opts.sessionId)
      .eq('owner_id', userId)
      .maybeSingle();
    if (again.data) return again.data;
    throw new Error('Failed to create chat session');
  }

  // Legacy fallback (no client id): reuse a recent empty session if possible.
  const reused = await findReusableSession(supabase, userId, opts, title);
  if (reused) return reused;

  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      owner_id: userId,
      project_id: opts.projectId ?? null,
      session_type: opts.sessionType,
      title,
    })
    .select('id, title')
    .single();

  if (error || !data) throw new Error('Failed to create chat session');
  return data;
}

async function findReusableSession(
  supabase: SupabaseClient,
  userId: string,
  opts: {
    sessionType: 'project' | 'search';
    projectId?: string | null;
  },
  title: string
): Promise<{ id: string; title: string | null } | null> {
  const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();

  let query = supabase
    .from('chat_sessions')
    .select('id, title, created_at')
    .eq('owner_id', userId)
    .eq('session_type', opts.sessionType)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5);

  query = opts.projectId
    ? query.eq('project_id', opts.projectId)
    : query.is('project_id', null);

  const { data: candidates } = await query;
  if (!candidates?.length) return null;

  for (const session of candidates) {
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('role')
      .eq('session_id', session.id);

    const roles = messages ?? [];
    const assistantCount = roles.filter((m) => m.role === 'assistant').length;
    const userCount = roles.filter((m) => m.role === 'user').length;

    if (assistantCount > 0) continue;

    if (roles.length === 0 || (userCount > 0 && session.title === title)) {
      return { id: session.id, title: session.title };
    }
  }

  return null;
}

/** Removes the most recent assistant reply in a session (used for regenerate). */
export async function deleteLastAssistantMessage(
  supabase: SupabaseClient,
  sessionId: string
): Promise<void> {
  const { data } = await supabase
    .from('chat_messages')
    .select('id')
    .eq('session_id', sessionId)
    .eq('role', 'assistant')
    .order('created_at', { ascending: false })
    .limit(1);

  const id = data?.[0]?.id;
  if (id) {
    await supabase.from('chat_messages').delete().eq('id', id);
  }
}

export async function saveChatMessage(
  supabase: SupabaseClient,
  row: {
    session_id: string;
    project_id?: string | null;
    role: 'user' | 'assistant';
    content: string;
    citations?: unknown[];
    metadata?: Record<string, unknown>;
  }
) {
  await supabase.from('chat_messages').insert({
    session_id: row.session_id,
    project_id: row.project_id ?? null,
    role: row.role,
    content: row.content,
    citations: row.citations ?? [],
    metadata: row.metadata ?? {},
  });
}
