import { createClient } from '@/lib/supabase/server';
import { nestProjectsWithStats, getProjectFamilyIds } from '@/lib/projects/hierarchy';
import { computeProjectStatus, resolveProjectStatus } from '@/lib/projects/health';
import { filterRelevantOpenActionItems } from '@/lib/relevance/action-items';
import {
  ensureFreshAppData,
  recordCitationsStillValid,
  refreshDerivedRecords,
  sunnyUpdateStillValid,
} from '@/lib/data/fresh-data';
import type {
  Project,
  ProjectWithStats,
  SunnyUpdate,
  CriticalItem,
  TimelineEvent,
  FileRecord,
  ActionItem,
  ChatMessage,
  ChatSession,
  GeneratedDocument,
  InboundEmailEvent,
} from '@/types/database';

async function enrichProjectStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  project: Project
): Promise<ProjectWithStats> {
  const projectId = project.id;
  const [files, criticalItems, actionItems, sunnyUpdates, failedFiles] = await Promise.all([
    supabase.from('files').select('id, source_type').eq('project_id', projectId),
    supabase.from('critical_items').select('severity').eq('project_id', projectId).eq('status', 'open'),
    supabase
      .from('action_items')
      .select('title, owner, item_kind, applies_to_me, matched_terms, status')
      .eq('project_id', projectId)
      .eq('status', 'open')
      .eq('applies_to_me', true),
    supabase
      .from('sunny_updates')
      .select('created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase.from('files').select('id').eq('project_id', projectId).eq('status', 'failed').limit(1),
  ]);

  const openCritical = criticalItems.data ?? [];
  const relevantActions = filterRelevantOpenActionItems(actionItems.data ?? []);
  const computedStatus = computeProjectStatus(openCritical, {
    hasFailedFiles: (failedFiles.data?.length ?? 0) > 0,
  });

  if (computedStatus !== project.status) {
    await supabase.from('projects').update({ status: computedStatus }).eq('id', projectId);
  }

  const fileList = files.data ?? [];
  return {
    ...project,
    status: computedStatus,
    file_count: fileList.length,
    meeting_count: fileList.filter((f) => f.source_type === 'meeting' || f.source_type === 'transcript').length,
    email_count: fileList.filter((f) => f.source_type === 'email').length,
    action_item_count: relevantActions.length,
    critical_item_count: openCritical.length,
    last_sunny_update: sunnyUpdates.data?.[0]?.created_at ?? null,
  };
}

export async function getProjectsWithStats(): Promise<ProjectWithStats[]> {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('last_activity_at', { ascending: false });

  if (!projects) return [];

  const enriched = await Promise.all(projects.map((project) => enrichProjectStats(supabase, project)));
  return nestProjectsWithStats(enriched);
}

export async function getTopLevelProjects(): Promise<ProjectWithStats[]> {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .is('parent_project_id', null)
    .order('project_name', { ascending: true });

  if (!projects) return [];
  return Promise.all(projects.map((project) => enrichProjectStats(supabase, project)));
}

export async function getSubProjects(parentProjectId: string): Promise<ProjectWithStats[]> {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('parent_project_id', parentProjectId)
    .order('project_name', { ascending: true });

  if (!projects) return [];
  return Promise.all(projects.map((project) => enrichProjectStats(supabase, project)));
}

export async function getParentProject(project: { parent_project_id: string | null }) {
  if (!project.parent_project_id) return null;
  return getProject(project.parent_project_id);
}

export async function getProject(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  if (!data) return null;
  const status = await resolveProjectStatus(supabase, projectId);
  return { ...data, status };
}

export async function getDashboardStats() {
  await ensureFreshAppData();
  const supabase = await createClient();
  const since = new Date(Date.now() - 86400000).toISOString();

  const filesByProject = await refreshDerivedRecords(supabase);

  const [criticalItems, recentUpdates, actionItems, conflicts] = await Promise.all([
    supabase.from('critical_items').select('id', { count: 'exact' }).eq('status', 'open'),
    supabase
      .from('sunny_updates')
      .select('id, project_id, source_citations, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false }),
    supabase
      .from('action_items')
      .select('title, owner, item_kind, applies_to_me, matched_terms, status')
      .eq('status', 'open')
      .eq('applies_to_me', true),
    supabase.from('critical_items').select('id', { count: 'exact' }).eq('category', 'conflict').eq('status', 'open'),
  ]);

  const validRecentUpdates = (recentUpdates.data ?? []).filter((update) =>
    sunnyUpdateStillValid(update, filesByProject)
  );
  const relevantActionCount = filterRelevantOpenActionItems(actionItems.data ?? []).length;

  return {
    criticalCount: criticalItems.count ?? 0,
    newUpdatesCount: validRecentUpdates.length,
    actionItemsCount: relevantActionCount,
    conflictsCount: conflicts.count ?? 0,
  };
}

export async function getCriticalItems(limit?: number): Promise<CriticalItem[]> {
  await ensureFreshAppData();
  const supabase = await createClient();
  const filesByProject = await refreshDerivedRecords(supabase);

  let query = supabase
    .from('critical_items')
    .select('*, projects(client_name, project_name)')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (limit) query = query.limit(limit * 3);

  const { data } = await query;
  const items = (data ?? [])
    .map((item) => ({
      ...item,
      source_citations: item.source_citations ?? [],
      project: item.projects as CriticalItem['project'],
    }))
    .filter((item) => recordCitationsStillValid(item, filesByProject));

  return limit ? items.slice(0, limit) : items;
}

export async function getOpenActionItems(limit?: number): Promise<ActionItem[]> {
  await ensureFreshAppData();
  const supabase = await createClient();

  let query = supabase
    .from('action_items')
    .select('*, projects(client_name, project_name)')
    .eq('status', 'open')
    .eq('applies_to_me', true)
    .order('created_at', { ascending: false });

  if (limit) query = query.limit(limit * 3);

  const { data } = await query;
  const items = filterRelevantOpenActionItems(
    (data ?? []).map((item) => ({
      ...item,
      source_citations: item.source_citations ?? [],
      matched_terms: item.matched_terms ?? [],
      project: item.projects as ActionItem['project'],
    }))
  );

  return limit ? items.slice(0, limit) : items;
}

export async function getActionItemsByStatus(
  status: Exclude<ActionItem['status'], 'open'>,
  limit = 50
): Promise<ActionItem[]> {
  await ensureFreshAppData();
  const supabase = await createClient();

  let query = supabase
    .from('action_items')
    .select('*, projects(client_name, project_name)')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status === 'cancelled') {
    query = query.eq('applies_to_me', false);
  } else {
    query = query.eq('applies_to_me', true);
  }

  const { data } = await query;
  return (data ?? []).map((item) => ({
    ...item,
    source_citations: item.source_citations ?? [],
    matched_terms: item.matched_terms ?? [],
    project: item.projects as ActionItem['project'],
  }));
}

export async function getSunnyUpdates(limit?: number): Promise<SunnyUpdate[]> {
  await ensureFreshAppData();
  const supabase = await createClient();
  const filesByProject = await refreshDerivedRecords(supabase);

  let query = supabase
    .from('sunny_updates')
    .select('*, projects(client_name, project_name)')
    .order('created_at', { ascending: false });

  if (limit) query = query.limit(limit * 3);

  const { data } = await query;
  const validUpdates = (data ?? [])
    .map((update) => ({
      ...update,
      source_citations: update.source_citations ?? [],
      project: update.projects as SunnyUpdate['project'],
    }))
    .filter((update) => sunnyUpdateStillValid(update, filesByProject));

  return limit ? validUpdates.slice(0, limit) : validUpdates;
}

export async function getPendingInboundEmails(): Promise<InboundEmailEvent[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const [owned, unclaimed] = await Promise.all([
    supabase
      .from('inbound_email_events')
      .select('*')
      .eq('owner_id', user.id)
      .eq('status', 'pending_assignment')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('inbound_email_events')
      .select('*')
      .is('owner_id', null)
      .in('status', ['pending_assignment', 'unmatched'])
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const merged = new Map<string, InboundEmailEvent>();
  for (const row of [...(owned.data ?? []), ...(unclaimed.data ?? [])]) {
    const event = row as InboundEmailEvent;
    if (
      event.status === 'pending_assignment' ||
      (event.status === 'unmatched' && event.detail?.includes('Could not determine which project'))
    ) {
      merged.set(event.id, event);
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
  );
}

export async function getProjectFiles(projectId: string): Promise<FileRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('files')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function getProjectCriticalItems(
  projectId: string,
  options?: { includeSubProjects?: boolean }
): Promise<CriticalItem[]> {
  const supabase = await createClient();
  const projectIds = await resolveProjectScopeIds(supabase, projectId, options?.includeSubProjects);

  if (options?.includeSubProjects) {
    const { data } = await supabase
      .from('critical_items')
      .select('*, projects(client_name, project_name)')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false });

    return (data ?? []).map((item) => ({
      ...item,
      source_citations: item.source_citations ?? [],
      project: item.projects as CriticalItem['project'],
    }));
  }

  const { data } = await supabase
    .from('critical_items')
    .select('*')
    .in('project_id', projectIds)
    .order('created_at', { ascending: false });

  return (data ?? []).map((item) => ({
    ...item,
    source_citations: item.source_citations ?? [],
  }));
}

export async function getProjectActionItems(
  projectId: string,
  options?: { includeSubProjects?: boolean; forMe?: boolean }
): Promise<ActionItem[]> {
  const supabase = await createClient();
  const projectIds = await resolveProjectScopeIds(supabase, projectId, options?.includeSubProjects);

  let query = supabase
    .from('action_items')
    .select('*')
    .in('project_id', projectIds);

  if (options?.forMe !== false) {
    query = query.eq('applies_to_me', true);
  }

  const { data } = await query.order('created_at', { ascending: false });
  const items = (data ?? []).map((item) => ({
    ...item,
    source_citations: item.source_citations ?? [],
    matched_terms: item.matched_terms ?? [],
  }));

  if (options?.forMe === false) return items;
  return filterRelevantOpenActionItems(items);
}

export async function getProjectTimeline(
  projectId: string,
  options?: { includeSubProjects?: boolean }
): Promise<TimelineEvent[]> {
  const supabase = await createClient();
  const projectIds = await resolveProjectScopeIds(supabase, projectId, options?.includeSubProjects);

  const { data } = await supabase
    .from('timeline_events')
    .select('*')
    .in('project_id', projectIds)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function getProjectEntities(
  projectId: string,
  options?: { includeSubProjects?: boolean }
) {
  const supabase = await createClient();
  const projectIds = await resolveProjectScopeIds(supabase, projectId, options?.includeSubProjects);

  const { data } = await supabase
    .from('entities')
    .select('*')
    .in('project_id', projectIds)
    .order('name');
  return data ?? [];
}

async function resolveProjectScopeIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  includeSubProjects?: boolean
): Promise<string[]> {
  const { data: project } = await supabase
    .from('projects')
    .select('id, parent_project_id')
    .eq('id', projectId)
    .single();

  if (!project) return [projectId];
  if (project.parent_project_id || !includeSubProjects) {
    return [projectId];
  }

  const { data: children } = await supabase
    .from('projects')
    .select('id')
    .eq('parent_project_id', projectId);

  return getProjectFamilyIds(project, children ?? []);
}

export async function getProjectChatMessages(projectId: string): Promise<ChatMessage[]> {
  const latest = await getLatestChatSessionForProject(projectId);
  return latest?.messages ?? [];
}

export function pickLatestChatSession(
  a: { session: ChatSession; messages: ChatMessage[] } | null,
  b: { session: ChatSession; messages: ChatMessage[] } | null
): { session: ChatSession; messages: ChatMessage[] } | null {
  if (!a) return b;
  if (!b) return a;
  const aTime = Date.parse(a.session.updated_at);
  const bTime = Date.parse(b.session.updated_at);
  return aTime >= bTime ? a : b;
}

/** Latest chat for a project, including legacy project-mode and search-mode sessions. */
export async function getLatestChatSessionForProject(
  projectId: string
): Promise<{ session: ChatSession; messages: ChatMessage[] } | null> {
  const [search, project] = await Promise.all([
    getLatestChatSession({ sessionType: 'search', projectId }),
    getLatestChatSession({ sessionType: 'project', projectId }),
  ]);
  return pickLatestChatSession(search, project);
}

export async function getLatestChatSession(opts: {
  sessionType: 'project' | 'search' | 'brief' | 'playbook';
  projectId?: string | null;
}): Promise<{ session: ChatSession; messages: ChatMessage[] } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let query = supabase
    .from('chat_sessions')
    .select('id, owner_id, title, project_id, session_type, created_at, updated_at')
    .eq('owner_id', user.id)
    .eq('session_type', opts.sessionType)
    .order('updated_at', { ascending: false })
    .limit(40);

  if (opts.projectId) {
    query = query.eq('project_id', opts.projectId);
  } else if (opts.sessionType === 'search') {
    query = query.is('project_id', null);
  }

  const { data: sessions } = await query;
  if (!sessions?.length) return null;

  for (const session of sessions) {
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    if (!messages?.length) continue;

    return {
      session: session as ChatSession,
      messages: messages.map((msg) => ({
        ...msg,
        citations: msg.citations ?? [],
      })),
    };
  }

  return null;
}

export async function getGeneratedDocuments(
  projectId: string,
  type?: string
): Promise<GeneratedDocument[]> {
  const supabase = await createClient();
  let query = supabase
    .from('generated_documents')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (type) query = query.eq('type', type);

  const { data } = await query;
  return (data ?? []).map((doc) => ({
    ...doc,
    citations: doc.citations ?? [],
  }));
}

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return { user, profile: data };
}
