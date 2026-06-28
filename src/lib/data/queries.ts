import { createClient } from '@/lib/supabase/server';
import { nestProjectsWithStats, getProjectFamilyIds } from '@/lib/projects/hierarchy';
import {
  ensureFreshAppData,
  recordCitationsStillValid,
  refreshDerivedRecords,
  sunnyUpdateStillValid,
} from '@/lib/data/fresh-data';
import type {
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
  project: Record<string, unknown>
): Promise<ProjectWithStats> {
  const projectId = project.id as string;
  const [files, criticalItems, actionItems, sunnyUpdates] = await Promise.all([
    supabase.from('files').select('id, source_type').eq('project_id', projectId),
    supabase.from('critical_items').select('id').eq('project_id', projectId).eq('status', 'open'),
    supabase.from('action_items').select('id').eq('project_id', projectId).eq('status', 'open'),
    supabase
      .from('sunny_updates')
      .select('created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  const fileList = files.data ?? [];
  return {
    ...(project as ProjectWithStats),
    file_count: fileList.length,
    meeting_count: fileList.filter((f) => f.source_type === 'meeting' || f.source_type === 'transcript').length,
    email_count: fileList.filter((f) => f.source_type === 'email').length,
    action_item_count: actionItems.data?.length ?? 0,
    critical_item_count: criticalItems.data?.length ?? 0,
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
  return data;
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
    supabase.from('action_items').select('id', { count: 'exact' }).eq('status', 'open'),
    supabase.from('critical_items').select('id', { count: 'exact' }).eq('category', 'conflict').eq('status', 'open'),
  ]);

  const validRecentUpdates = (recentUpdates.data ?? []).filter((update) =>
    sunnyUpdateStillValid(update, filesByProject)
  );

  return {
    criticalCount: criticalItems.count ?? 0,
    newUpdatesCount: validRecentUpdates.length,
    actionItemsCount: actionItems.count ?? 0,
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

  const { data } = await supabase
    .from('inbound_email_events')
    .select('*')
    .eq('owner_id', user.id)
    .eq('status', 'pending_assignment')
    .order('created_at', { ascending: false })
    .limit(20);

  return (data ?? []) as InboundEmailEvent[];
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

  const { data } = await supabase
    .from('critical_items')
    .select(
      options?.includeSubProjects
        ? '*, projects(client_name, project_name)'
        : '*'
    )
    .in('project_id', projectIds)
    .order('created_at', { ascending: false });
  return (data ?? []).map((item) => ({
    ...item,
    source_citations: item.source_citations ?? [],
    project: options?.includeSubProjects
      ? (item.projects as CriticalItem['project'])
      : undefined,
  }));
}

export async function getProjectActionItems(
  projectId: string,
  options?: { includeSubProjects?: boolean }
): Promise<ActionItem[]> {
  const supabase = await createClient();
  const projectIds = await resolveProjectScopeIds(supabase, projectId, options?.includeSubProjects);

  const { data } = await supabase
    .from('action_items')
    .select('*')
    .in('project_id', projectIds)
    .order('created_at', { ascending: false });
  return (data ?? []).map((item) => ({
    ...item,
    source_citations: item.source_citations ?? [],
  }));
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
  const latest = await getLatestChatSession({ sessionType: 'project', projectId });
  return latest?.messages ?? [];
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
