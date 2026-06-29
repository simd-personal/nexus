import type { SupabaseClient } from '@supabase/supabase-js';
import { extractSearchTerms, textMatchesTerms } from './terms';

type ProjectRef = { client_name: string; project_name: string };

function asProjectRef(value: unknown): ProjectRef | null {
  if (!value) return null;
  if (Array.isArray(value)) return (value[0] as ProjectRef | undefined) ?? null;
  return value as ProjectRef;
}

export interface RetrievedChunk {
  id: string;
  project_id: string;
  file_id?: string;
  chunk_index?: number;
  text: string;
  metadata: Record<string, unknown>;
  similarity?: number;
  rank?: number;
  match_reason: string;
  file_name?: string;
  source_type?: string;
  client_name?: string;
  project_name?: string;
}

type RpcChunk = {
  id: string;
  project_id: string;
  file_id: string;
  chunk_index: number;
  text: string;
  metadata: Record<string, unknown>;
  similarity?: number;
  rank?: number;
};

async function getAccessibleProjectIds(
  supabase: SupabaseClient,
  scopedProjectIds: string[] | null
): Promise<Set<string>> {
  let query = supabase.from('projects').select('id');
  if (scopedProjectIds?.length === 1) {
    query = query.eq('id', scopedProjectIds[0]);
  } else if (scopedProjectIds && scopedProjectIds.length > 1) {
    query = query.in('id', scopedProjectIds);
  }
  const { data } = await query;
  return new Set((data ?? []).map((row) => row.id));
}

function rpcProjectFilter(scopedProjectIds: string[] | null): string | null {
  if (scopedProjectIds?.length === 1) return scopedProjectIds[0];
  return null;
}

export function filterResultsToAccessibleProjects<T extends { project_id: string }>(
  rows: T[],
  accessibleProjectIds: Set<string>
): T[] {
  if (accessibleProjectIds.size === 0) return [];
  return rows.filter((row) => accessibleProjectIds.has(row.project_id));
}

export async function retrieveForQuery(
  supabase: SupabaseClient,
  query: string,
  embedding: number[] | null,
  options: { projectId?: string | null; projectIds?: string[] | null; limit?: number } = {}
): Promise<RetrievedChunk[]> {
  const limit = options.limit ?? 24;
  const scopedProjectIds =
    options.projectIds ??
    (options.projectId ? [options.projectId] : null);
  const accessibleProjectIds = await getAccessibleProjectIds(supabase, scopedProjectIds);
  const rpcProjectId = rpcProjectFilter(scopedProjectIds);

  const [{ data: vectorResults }, { data: keywordResults }, { data: fuzzyResults }] =
    await Promise.all([
      embedding
        ? supabase.rpc('match_chunks', {
            query_embedding: embedding,
            match_threshold: 0.2,
            match_count: limit,
            filter_project_id: rpcProjectId,
          })
        : Promise.resolve({ data: [] as RpcChunk[] | null }),
      supabase.rpc('search_chunks_keyword', {
        search_query: query,
        filter_project_id: rpcProjectId,
        match_count: limit,
      }),
      supabase.rpc('search_chunks_fuzzy', {
        search_query: query,
        filter_project_id: rpcProjectId,
        match_count: limit,
      }),
    ]);

  const seen = new Set<string>();
  const merged: RetrievedChunk[] = [];

  const push = (row: RpcChunk, match_reason: string) => {
    if (seen.has(row.id)) return;
    seen.add(row.id);
    merged.push({ ...row, match_reason });
  };

  for (const row of vectorResults ?? []) push(row, 'Semantic match');
  for (const row of keywordResults ?? []) push(row, 'Keyword match');
  for (const row of fuzzyResults ?? []) push(row, 'Related match');

  const supplemental = await fetchSupplementalContent(supabase, query, scopedProjectIds, seen);
  merged.push(...supplemental);

  const scoped = filterResultsToAccessibleProjects(merged, accessibleProjectIds);

  scoped.sort((a, b) => {
    const scoreA = a.similarity ?? a.rank ?? 0;
    const scoreB = b.similarity ?? b.rank ?? 0;
    return scoreB - scoreA;
  });

  const enriched = await enrichResults(supabase, scoped.slice(0, limit * 2));
  return enriched.slice(0, limit);
}

async function fetchSupplementalContent(
  supabase: SupabaseClient,
  query: string,
  scopedProjectIds: string[] | null,
  seen: Set<string>
): Promise<RetrievedChunk[]> {
  const terms = extractSearchTerms(query);
  if (terms.length === 0) return [];

  const results: RetrievedChunk[] = [];
  const add = (row: RetrievedChunk) => {
    if (seen.has(row.id)) return;
    seen.add(row.id);
    results.push(row);
  };

  let filesQuery = supabase
    .from('files')
    .select('id, project_id, file_name, source_type, extracted_text, projects(client_name, project_name)')
    .not('extracted_text', 'is', null);
  if (scopedProjectIds?.length === 1) {
    filesQuery = filesQuery.eq('project_id', scopedProjectIds[0]);
  } else if (scopedProjectIds && scopedProjectIds.length > 1) {
    filesQuery = filesQuery.in('project_id', scopedProjectIds);
  }
  const { data: files } = await filesQuery.limit(40);

  for (const file of files ?? []) {
    const text = file.extracted_text ?? '';
    if (!textMatchesTerms(text, terms)) continue;
    const project = asProjectRef(file.projects);
    add({
      id: `file-text-${file.id}`,
      project_id: file.project_id,
      file_id: file.id,
      text: text.slice(0, 4000),
      metadata: { file_name: file.file_name, source_type: file.source_type },
      match_reason: 'File content match',
      file_name: file.file_name,
      source_type: file.source_type,
      client_name: project?.client_name,
      project_name: project?.project_name,
      rank: terms.filter((t) => text.toLowerCase().includes(t)).length,
    });
  }

  let projectsQuery = supabase
    .from('projects')
    .select('id, client_name, project_name, description, last_summary');
  if (scopedProjectIds?.length === 1) {
    projectsQuery = projectsQuery.eq('id', scopedProjectIds[0]);
  } else if (scopedProjectIds && scopedProjectIds.length > 1) {
    projectsQuery = projectsQuery.in('id', scopedProjectIds);
  }
  const { data: projects } = await projectsQuery;

  for (const project of projects ?? []) {
    const combined = [project.project_name, project.client_name, project.description, project.last_summary]
      .filter(Boolean)
      .join('\n');
    if (!textMatchesTerms(combined, terms)) continue;
    add({
      id: `project-${project.id}`,
      project_id: project.id,
      text: combined,
      metadata: { source_type: 'note', file_name: `${project.client_name} · ${project.project_name}` },
      match_reason: 'Project match',
      file_name: `${project.client_name} · ${project.project_name}`,
      source_type: 'note',
      client_name: project.client_name,
      project_name: project.project_name,
      rank: terms.filter((t) => combined.toLowerCase().includes(t)).length + 0.5,
    });
  }

  const tableQueries = [
    {
      table: 'critical_items' as const,
      select: 'id, project_id, title, summary, projects(client_name, project_name)',
      prefix: 'critical',
      textFn: (r: { title: string; summary: string }) => `${r.title}\n${r.summary}`,
    },
    {
      table: 'sunny_updates' as const,
      select: 'id, project_id, title, summary, why_it_matters, projects(client_name, project_name)',
      prefix: 'update',
      textFn: (r: { title: string; summary: string; why_it_matters: string }) =>
        `${r.title}\n${r.summary}\n${r.why_it_matters}`,
    },
    {
      table: 'action_items' as const,
      select: 'id, project_id, title, owner, projects(client_name, project_name)',
      prefix: 'action',
      textFn: (r: { title: string; owner: string | null }) =>
        `${r.title}${r.owner ? ` (Owner: ${r.owner})` : ''}`,
    },
    {
      table: 'entities' as const,
      select: 'id, project_id, name, type, projects(client_name, project_name)',
      prefix: 'entity',
      textFn: (r: { name: string; type: string }) => `${r.type}: ${r.name}`,
    },
    {
      table: 'generated_documents' as const,
      select: 'id, project_id, title, content, type, projects(client_name, project_name)',
      prefix: 'doc',
      textFn: (r: { title: string; content: string }) => `${r.title}\n${r.content}`,
    },
  ];

  for (const { table, select, prefix, textFn } of tableQueries) {
    let q = supabase.from(table).select(select).limit(30);
    if (scopedProjectIds?.length === 1) {
      q = q.eq('project_id', scopedProjectIds[0]);
    } else if (scopedProjectIds && scopedProjectIds.length > 1) {
      q = q.in('project_id', scopedProjectIds);
    }
    const { data: rows } = await q;

    for (const row of rows ?? []) {
      const record = row as unknown as Record<string, unknown>;
      const text = textFn(record as never);
      if (!textMatchesTerms(text, terms)) continue;
      const project = asProjectRef(record.projects);
      add({
        id: `${prefix}-${String(record.id)}`,
        project_id: String(record.project_id),
        text: text.slice(0, 4000),
        metadata: { source_type: 'note', file_name: prefix },
        match_reason: `${table.replace('_', ' ')} match`,
        file_name: project ? `${project.client_name} · ${project.project_name}` : undefined,
        source_type: 'note',
        client_name: project?.client_name,
        project_name: project?.project_name,
        rank: terms.filter((t) => text.toLowerCase().includes(t)).length,
      });
    }
  }

  return results;
}

async function enrichResults(
  supabase: SupabaseClient,
  rows: RetrievedChunk[]
): Promise<RetrievedChunk[]> {
  const fileIds = [...new Set(rows.map((r) => r.file_id).filter(Boolean))] as string[];
  const projectIds = [...new Set(rows.map((r) => r.project_id))];

  const [{ data: files }, { data: projects }] = await Promise.all([
    fileIds.length
      ? supabase.from('files').select('id, file_name, source_type, created_at').in('id', fileIds)
      : Promise.resolve({ data: [] }),
    supabase.from('projects').select('id, client_name, project_name, last_summary').in('id', projectIds),
  ]);

  const fileMap = new Map((files ?? []).map((f) => [f.id, f]));
  const projectMap = new Map((projects ?? []).map((p) => [p.id, p]));

  return rows.map((row) => {
    const file = row.file_id ? fileMap.get(row.file_id) : undefined;
    const project = projectMap.get(row.project_id);
    return {
      ...row,
      file_name: row.file_name ?? file?.file_name ?? (row.metadata?.file_name as string | undefined),
      source_type: row.source_type ?? file?.source_type,
      client_name: row.client_name ?? project?.client_name,
      project_name: row.project_name ?? project?.project_name,
    };
  });
}

export function toSearchContext(
  rows: RetrievedChunk[],
  options?: { labelProject?: boolean }
) {
  return rows.map((r) => {
    const baseName = r.file_name ?? 'Unknown';
    const file_name =
      options?.labelProject && r.client_name && r.project_name
        ? `[${r.client_name} · ${r.project_name}] ${baseName}`
        : baseName;
    return {
      text: r.text,
      file_name,
      source_type: r.source_type,
      metadata: { ...r.metadata, file_id: r.file_id },
    };
  });
}
