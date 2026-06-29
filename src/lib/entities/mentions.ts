import type { SupabaseClient } from '@supabase/supabase-js';
import { getProjectFamilyIds } from '@/lib/projects/hierarchy';
import { createClient } from '@/lib/supabase/server';
import { normalizeEntityName } from '@/lib/utils';
import type { SourceType } from '@/types/database';

export type EntityMentionSnippet = {
  text: string;
  chunk_index: number;
  page_number?: number;
};

export type EntityMentionSource = {
  file_id: string;
  file_name: string;
  source_type?: SourceType;
  snippets: EntityMentionSnippet[];
};

export type EntityMentionResult = {
  name: string;
  type: 'person' | 'facility';
  sources: EntityMentionSource[];
};

export type GetEntityMentionsOptions = {
  includeSubProjects?: boolean;
  type?: 'person' | 'facility';
};

type RpcChunk = {
  id: string;
  project_id: string;
  file_id: string;
  chunk_index: number;
  text: string;
  metadata: Record<string, unknown>;
  rank?: number;
};

type ScoredChunk = RpcChunk & { score: number };

const MAX_SOURCES = 5;
const MAX_SNIPPETS_PER_FILE = 2;
const SEARCH_LIMIT = 40;

export function extractMentionSnippet(text: string, query: string, radius = 120): string {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    if (text.length <= radius * 2) return text.trim();
    return `${text.slice(0, radius * 2).trim()}…`;
  }

  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + query.length + radius);
  let snippet = text.slice(start, end).trim();
  if (start > 0) snippet = `…${snippet}`;
  if (end < text.length) snippet = `${snippet}…`;
  return snippet;
}

function chunkContainsName(text: string, name: string): boolean {
  return normalizeEntityName(text).includes(normalizeEntityName(name));
}

function rpcProjectFilter(projectIds: string[]): string | null {
  if (projectIds.length === 1) return projectIds[0];
  return null;
}

function ilikePattern(name: string): string {
  const escaped = name.replace(/[%_\\]/g, '\\$&');
  return `%${escaped}%`;
}

async function resolveProjectScopeIds(
  supabase: SupabaseClient,
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

async function fetchIlikeChunks(
  supabase: SupabaseClient,
  name: string,
  projectIds: string[]
): Promise<RpcChunk[]> {
  let query = supabase
    .from('chunks')
    .select('id, project_id, file_id, chunk_index, text, metadata')
    .ilike('text', ilikePattern(name))
    .limit(SEARCH_LIMIT);

  if (projectIds.length === 1) {
    query = query.eq('project_id', projectIds[0]);
  } else if (projectIds.length > 1) {
    query = query.in('project_id', projectIds);
  }

  const { data } = await query;
  return (data ?? []) as RpcChunk[];
}

async function searchChunksForEntity(
  supabase: SupabaseClient,
  name: string,
  projectIds: string[]
): Promise<ScoredChunk[]> {
  const rpcProjectId = rpcProjectFilter(projectIds);

  const [{ data: keywordResults }, { data: fuzzyResults }] = await Promise.all([
    supabase.rpc('search_chunks_keyword', {
      search_query: name,
      filter_project_id: rpcProjectId,
      match_count: SEARCH_LIMIT,
    }),
    supabase.rpc('search_chunks_fuzzy', {
      search_query: name,
      filter_project_id: rpcProjectId,
      match_count: SEARCH_LIMIT,
    }),
  ]);

  const byId = new Map<string, ScoredChunk>();

  const upsert = (row: RpcChunk, score: number) => {
    const existing = byId.get(row.id);
    if (existing) {
      existing.score = Math.max(existing.score, score);
      return;
    }
    byId.set(row.id, { ...row, score });
  };

  for (const row of (keywordResults ?? []) as RpcChunk[]) {
    upsert(row, row.rank ?? 0);
  }
  for (const row of (fuzzyResults ?? []) as RpcChunk[]) {
    upsert(row, row.rank ?? 0);
  }

  let chunks = [...byId.values()];

  if (projectIds.length > 1) {
    const allowed = new Set(projectIds);
    chunks = chunks.filter((chunk) => allowed.has(chunk.project_id));
  }

  const matching = chunks.filter(
    (chunk) => chunk.file_id && chunkContainsName(chunk.text, name)
  );

  const shouldFallback =
    normalizeEntityName(name).length <= 4 || matching.length === 0;

  if (shouldFallback) {
    const ilikeRows = await fetchIlikeChunks(supabase, name, projectIds);
    for (const row of ilikeRows) {
      if (!row.file_id || !chunkContainsName(row.text, name)) continue;
      upsert(row, 0.5);
    }
    chunks = [...byId.values()];
    if (projectIds.length > 1) {
      const allowed = new Set(projectIds);
      chunks = chunks.filter((chunk) => allowed.has(chunk.project_id));
    }
    return chunks.filter((chunk) => chunk.file_id && chunkContainsName(chunk.text, name));
  }

  return matching;
}

function groupChunksByFile(chunks: ScoredChunk[]): Map<string, ScoredChunk[]> {
  const grouped = new Map<string, ScoredChunk[]>();

  for (const chunk of chunks) {
    const fileId = chunk.file_id;
    const list = grouped.get(fileId) ?? [];
    list.push(chunk);
    grouped.set(fileId, list);
  }

  for (const list of grouped.values()) {
    list.sort((a, b) => b.score - a.score);
  }

  return grouped;
}

function pageNumberFromMetadata(metadata: Record<string, unknown>): number | undefined {
  const value = metadata.page_number;
  return typeof value === 'number' ? value : undefined;
}

export async function getEntityMentions(
  projectId: string,
  name: string,
  options: GetEntityMentionsOptions = {}
): Promise<EntityMentionResult> {
  const supabase = await createClient();
  const projectIds = await resolveProjectScopeIds(
    supabase,
    projectId,
    options.includeSubProjects
  );

  const chunks = await searchChunksForEntity(supabase, name, projectIds);
  const grouped = groupChunksByFile(chunks);

  const rankedFiles = [...grouped.entries()]
    .map(([fileId, fileChunks]) => ({
      fileId,
      bestScore: fileChunks[0]?.score ?? 0,
      chunks: fileChunks.slice(0, MAX_SNIPPETS_PER_FILE),
    }))
    .sort((a, b) => b.bestScore - a.bestScore)
    .slice(0, MAX_SOURCES);

  const fileIds = rankedFiles.map((entry) => entry.fileId);
  const { data: files } = fileIds.length
    ? await supabase.from('files').select('id, file_name, source_type').in('id', fileIds)
    : { data: [] as Array<{ id: string; file_name: string; source_type: SourceType }> };

  const fileMap = new Map((files ?? []).map((file) => [file.id, file]));

  const sources: EntityMentionSource[] = [];

  for (const { fileId, chunks: fileChunks } of rankedFiles) {
    const file = fileMap.get(fileId);
    if (!file) continue;

    sources.push({
      file_id: fileId,
      file_name: file.file_name,
      source_type: file.source_type,
      snippets: fileChunks.map((chunk) => ({
        text: extractMentionSnippet(chunk.text, name),
        chunk_index: chunk.chunk_index,
        page_number: pageNumberFromMetadata(chunk.metadata),
      })),
    });
  }

  return {
    name,
    type: options.type ?? 'person',
    sources,
  };
}
