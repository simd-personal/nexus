import { createClient } from '@/lib/supabase/server';
import type { RequestSupabaseClient } from '@/lib/supabase/request-auth';
import { nestProjectsWithStats, getProjectFamilyIds } from '@/lib/projects/hierarchy';
import { computeProjectStatus, resolveProjectStatus } from '@/lib/projects/health';
import { filterRelevantOpenActionItems } from '@/lib/relevance/action-items';
import { getProjectIdsForPortfolioScope } from '@/lib/data/portfolio-scope';
import { isDashboardIndexingActive } from '@/lib/dashboard/indexing-active';
import {
  getActiveUploadBatches,
  getPendingIndexingFiles as loadPendingIndexingFiles,
  type ActiveUploadBatch,
  type PendingIndexingFile,
} from '@/lib/processing/upload-batch';
import type { DashboardPortfolioScope } from '@/lib/projects/portfolio';
import {
  ensureFreshAppData,
  recordCitationsStillValid,
  refreshDerivedRecords,
  sunnyUpdateStillValid,
} from '@/lib/data/fresh-data';
import { pruneOrphanedEntities } from '@/lib/files/purge-derived-content';
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

async function resolveSupabase(supabase?: RequestSupabaseClient) {
  return supabase ?? (await createClient());
}

async function enrichProjectStats(
  supabase: RequestSupabaseClient,
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

export async function getProjectsWithStats(options?: {
  portfolio?: DashboardPortfolioScope;
  supabase?: RequestSupabaseClient;
}): Promise<ProjectWithStats[]> {
  const supabase = await resolveSupabase(options?.supabase);

  let query = supabase.from('projects').select('*').order('last_activity_at', { ascending: false });

  if (options?.portfolio && options.portfolio !== 'all') {
    query = query.eq('portfolio', options.portfolio);
  }

  const { data: projects } = await query;

  if (!projects) return [];

  const enriched = await Promise.all(projects.map((project) => enrichProjectStats(supabase, project)));
  return nestProjectsWithStats(enriched);
}

export async function getDashboardPortfolioPreference(
  supabaseClient?: RequestSupabaseClient
): Promise<DashboardPortfolioScope> {
  const supabase = await resolveSupabase(supabaseClient);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 'work';

  const { data: profile } = await supabase
    .from('profiles')
    .select('dashboard_portfolio')
    .eq('user_id', user.id)
    .single();

  const scope = profile?.dashboard_portfolio;
  return scope === 'personal' || scope === 'all' ? scope : 'work';
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

export async function getProject(projectId: string, supabaseClient?: RequestSupabaseClient) {
  const supabase = await resolveSupabase(supabaseClient);
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  if (!data) return null;
  const status = await resolveProjectStatus(supabase, projectId);
  return { ...data, status };
}

export async function getDashboardStats(
  portfolioScope: DashboardPortfolioScope = 'work',
  supabaseClient?: RequestSupabaseClient
) {
  await ensureFreshAppData();
  const supabase = await resolveSupabase(supabaseClient);
  const since = new Date(Date.now() - 86400000).toISOString();
  const scopedProjectIds = await getProjectIdsForPortfolioScope(supabase, portfolioScope);

  if (scopedProjectIds?.length === 0) {
    return {
      criticalCount: 0,
      newUpdatesCount: 0,
      actionItemsCount: 0,
      conflictsCount: 0,
    };
  }

  const filesByProject = await refreshDerivedRecords(supabase);

  let criticalQuery = supabase.from('critical_items').select('id', { count: 'exact' }).eq('status', 'open');
  let updatesQuery = supabase
    .from('sunny_updates')
    .select('id, project_id, source_citations, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false });
  let actionQuery = supabase
    .from('action_items')
    .select('title, owner, item_kind, applies_to_me, matched_terms, status')
    .eq('status', 'open')
    .eq('applies_to_me', true);
  let conflictsQuery = supabase
    .from('critical_items')
    .select('id', { count: 'exact' })
    .eq('category', 'conflict')
    .eq('status', 'open');

  if (scopedProjectIds) {
    criticalQuery = criticalQuery.in('project_id', scopedProjectIds);
    updatesQuery = updatesQuery.in('project_id', scopedProjectIds);
    actionQuery = actionQuery.in('project_id', scopedProjectIds);
    conflictsQuery = conflictsQuery.in('project_id', scopedProjectIds);
  }

  const [criticalItems, recentUpdates, actionItems, conflicts] = await Promise.all([
    criticalQuery,
    updatesQuery,
    actionQuery,
    conflictsQuery,
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

export async function getCriticalItems(
  limit?: number,
  portfolioScope: DashboardPortfolioScope = 'work',
  supabaseClient?: RequestSupabaseClient
): Promise<CriticalItem[]> {
  await ensureFreshAppData();
  const supabase = await resolveSupabase(supabaseClient);
  const scopedProjectIds = await getProjectIdsForPortfolioScope(supabase, portfolioScope);
  if (scopedProjectIds?.length === 0) return [];

  const filesByProject = await refreshDerivedRecords(supabase);

  let query = supabase
    .from('critical_items')
    .select('*, projects(client_name, project_name)')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (scopedProjectIds) {
    query = query.in('project_id', scopedProjectIds);
  }

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

export async function getOpenActionItems(
  limit?: number,
  portfolioScope: DashboardPortfolioScope = 'work',
  supabaseClient?: RequestSupabaseClient
): Promise<ActionItem[]> {
  await ensureFreshAppData();
  const supabase = await resolveSupabase(supabaseClient);
  const scopedProjectIds = await getProjectIdsForPortfolioScope(supabase, portfolioScope);
  if (scopedProjectIds?.length === 0) return [];

  let query = supabase
    .from('action_items')
    .select('*, projects(client_name, project_name)')
    .eq('status', 'open')
    .eq('applies_to_me', true)
    .order('created_at', { ascending: false });

  if (scopedProjectIds) {
    query = query.in('project_id', scopedProjectIds);
  }

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
  limit = 50,
  portfolioScope: DashboardPortfolioScope = 'work'
): Promise<ActionItem[]> {
  await ensureFreshAppData();
  const supabase = await createClient();
  const scopedProjectIds = await getProjectIdsForPortfolioScope(supabase, portfolioScope);
  if (scopedProjectIds?.length === 0) return [];

  let query = supabase
    .from('action_items')
    .select('*, projects(client_name, project_name)')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (scopedProjectIds) {
    query = query.in('project_id', scopedProjectIds);
  }

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

export async function getSunnyUpdates(
  limit?: number,
  portfolioScope: DashboardPortfolioScope = 'work',
  supabaseClient?: RequestSupabaseClient
): Promise<SunnyUpdate[]> {
  await ensureFreshAppData();
  const supabase = await resolveSupabase(supabaseClient);
  const scopedProjectIds = await getProjectIdsForPortfolioScope(supabase, portfolioScope);
  if (scopedProjectIds?.length === 0) return [];

  const filesByProject = await refreshDerivedRecords(supabase);

  let query = supabase
    .from('sunny_updates')
    .select('*, projects(client_name, project_name)')
    .order('created_at', { ascending: false });

  if (scopedProjectIds) {
    query = query.in('project_id', scopedProjectIds);
  }

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

export async function getSunnyUpdateById(
  id: string,
  supabaseClient?: RequestSupabaseClient
): Promise<SunnyUpdate | null> {
  await ensureFreshAppData();
  const supabase = await resolveSupabase(supabaseClient);
  const filesByProject = await refreshDerivedRecords(supabase);

  const { data, error } = await supabase
    .from('sunny_updates')
    .select('*, projects(client_name, project_name)')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;

  const update: SunnyUpdate = {
    ...data,
    source_citations: data.source_citations ?? [],
    project: data.projects as SunnyUpdate['project'],
  };

  return sunnyUpdateStillValid(update, filesByProject) ? update : null;
}

export async function hasProcessingFilesInPortfolioScope(
  portfolioScope: DashboardPortfolioScope = 'work',
  supabaseClient?: RequestSupabaseClient
): Promise<boolean> {
  await ensureFreshAppData();
  const supabase = await resolveSupabase(supabaseClient);
  const scopedProjectIds = await getProjectIdsForPortfolioScope(supabase, portfolioScope);
  if (scopedProjectIds?.length === 0) return false;

  let query = supabase
    .from('files')
    .select('id')
    .in('status', ['pending', 'processing'])
    .limit(1);

  if (scopedProjectIds) {
    query = query.in('project_id', scopedProjectIds);
  }

  const { data } = await query;
  return (data?.length ?? 0) > 0;
}

export type DashboardUpdatesFeed = {
  updates: SunnyUpdate[];
  pendingBatches: ActiveUploadBatch[];
  pendingFiles: PendingIndexingFile[];
  indexingActive: boolean;
};

export async function getDashboardUpdatesFeed(
  limit: number,
  portfolioScope: DashboardPortfolioScope = 'work',
  supabaseClient?: RequestSupabaseClient
): Promise<DashboardUpdatesFeed> {
  const [updates, pendingBatches, pendingFiles, processingActive] = await Promise.all([
    getSunnyUpdates(limit, portfolioScope, supabaseClient),
    getPendingUploadBatches(portfolioScope, supabaseClient),
    getPendingIndexingFiles(portfolioScope, supabaseClient),
    hasProcessingFilesInPortfolioScope(portfolioScope, supabaseClient),
  ]);

  return {
    updates,
    pendingBatches,
    pendingFiles,
    indexingActive: isDashboardIndexingActive(pendingBatches, processingActive),
  };
}

export async function getPendingIndexingFiles(
  portfolioScope: DashboardPortfolioScope = 'work',
  supabaseClient?: RequestSupabaseClient
): Promise<PendingIndexingFile[]> {
  await ensureFreshAppData();
  const supabase = await resolveSupabase(supabaseClient);
  const scopedProjectIds = await getProjectIdsForPortfolioScope(supabase, portfolioScope);
  return loadPendingIndexingFiles(supabase, scopedProjectIds);
}

export async function getPendingUploadBatches(
  portfolioScope: DashboardPortfolioScope = 'work',
  supabaseClient?: RequestSupabaseClient
) {
  await ensureFreshAppData();
  const supabase = await resolveSupabase(supabaseClient);
  const scopedProjectIds = await getProjectIdsForPortfolioScope(supabase, portfolioScope);
  return getActiveUploadBatches(supabase, scopedProjectIds);
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
  options?: { includeSubProjects?: boolean; supabase?: RequestSupabaseClient }
): Promise<CriticalItem[]> {
  const supabase = await resolveSupabase(options?.supabase);
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

  await pruneOrphanedEntities(supabase, projectIds);

  const { data } = await supabase
    .from('entities')
    .select('*')
    .in('project_id', projectIds)
    .not('source_file_id', 'is', null)
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
