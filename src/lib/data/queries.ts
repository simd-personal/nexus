import { createClient } from '@/lib/supabase/server';
import type {
  ProjectWithStats,
  SunnyUpdate,
  CriticalItem,
  TimelineEvent,
  FileRecord,
  ActionItem,
  ChatMessage,
  GeneratedDocument,
} from '@/types/database';

export async function getProjectsWithStats(): Promise<ProjectWithStats[]> {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('last_activity_at', { ascending: false });

  if (!projects) return [];

  const enriched = await Promise.all(
    projects.map(async (project) => {
      const [files, criticalItems, actionItems, sunnyUpdates] = await Promise.all([
        supabase.from('files').select('id, source_type').eq('project_id', project.id),
        supabase.from('critical_items').select('id').eq('project_id', project.id).eq('status', 'open'),
        supabase.from('action_items').select('id').eq('project_id', project.id).eq('status', 'open'),
        supabase.from('sunny_updates').select('created_at').eq('project_id', project.id).order('created_at', { ascending: false }).limit(1),
      ]);

      const fileList = files.data ?? [];
      return {
        ...project,
        file_count: fileList.length,
        meeting_count: fileList.filter((f) => f.source_type === 'meeting' || f.source_type === 'transcript').length,
        email_count: fileList.filter((f) => f.source_type === 'email').length,
        action_item_count: actionItems.data?.length ?? 0,
        critical_item_count: criticalItems.data?.length ?? 0,
        last_sunny_update: sunnyUpdates.data?.[0]?.created_at ?? null,
      };
    })
  );

  return enriched;
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
  const supabase = await createClient();

  const [criticalItems, sunnyUpdates, actionItems, conflicts] = await Promise.all([
    supabase.from('critical_items').select('id', { count: 'exact' }).eq('status', 'open'),
    supabase.from('sunny_updates').select('id', { count: 'exact' }).gte('created_at', new Date(Date.now() - 86400000).toISOString()),
    supabase.from('action_items').select('id', { count: 'exact' }).eq('status', 'open'),
    supabase.from('critical_items').select('id', { count: 'exact' }).eq('category', 'conflict').eq('status', 'open'),
  ]);

  return {
    criticalCount: criticalItems.count ?? 0,
    newUpdatesCount: sunnyUpdates.count ?? 0,
    actionItemsCount: actionItems.count ?? 0,
    conflictsCount: conflicts.count ?? 0,
  };
}

export async function getCriticalItems(limit?: number): Promise<CriticalItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from('critical_items')
    .select('*, projects(client_name, project_name)')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (limit) query = query.limit(limit);

  const { data } = await query;
  return (data ?? []).map((item) => ({
    ...item,
    source_citations: item.source_citations ?? [],
    project: item.projects as CriticalItem['project'],
  }));
}

export async function getSunnyUpdates(limit?: number): Promise<SunnyUpdate[]> {
  const supabase = await createClient();
  let query = supabase
    .from('sunny_updates')
    .select('*, projects(client_name, project_name)')
    .order('created_at', { ascending: false });

  if (limit) query = query.limit(limit);

  const { data } = await query;
  return (data ?? []).map((update) => ({
    ...update,
    source_citations: update.source_citations ?? [],
    project: update.projects as SunnyUpdate['project'],
  }));
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

export async function getProjectCriticalItems(projectId: string): Promise<CriticalItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('critical_items')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  return (data ?? []).map((item) => ({
    ...item,
    source_citations: item.source_citations ?? [],
  }));
}

export async function getProjectActionItems(projectId: string): Promise<ActionItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('action_items')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  return (data ?? []).map((item) => ({
    ...item,
    source_citations: item.source_citations ?? [],
  }));
}

export async function getProjectTimeline(projectId: string): Promise<TimelineEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('timeline_events')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function getProjectChatMessages(projectId: string): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  return (data ?? []).map((msg) => ({
    ...msg,
    citations: msg.citations ?? [],
  }));
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

export async function getProjectEntities(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('entities')
    .select('*')
    .eq('project_id', projectId)
    .order('name');
  return data ?? [];
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
