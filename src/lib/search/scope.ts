import type { SupabaseClient } from '@supabase/supabase-js';
import type { RetrievedChunk } from './retrieve';
import { toSearchContext } from './retrieve';
import { ANSWER_CONTEXT_CHUNK_LIMIT } from '@/lib/search/context-limits';

export function normalizeProjectId(projectId?: string | null): string | null {
  const trimmed = projectId?.trim();
  return trimmed ? trimmed : null;
}

export function normalizeProjectIds(
  projectIds?: string[] | null,
  legacyProjectId?: string | null
): string[] | null {
  const fromArray = (projectIds ?? []).map((id) => id.trim()).filter(Boolean);
  if (fromArray.length > 0) return [...new Set(fromArray)];

  const single = normalizeProjectId(legacyProjectId);
  return single ? [single] : null;
}

export function filterResultsToProject(
  results: RetrievedChunk[],
  projectId: string | null
): RetrievedChunk[] {
  if (!projectId) return results;
  return results.filter((r) => r.project_id === projectId);
}

export function filterResultsToProjects(
  results: RetrievedChunk[],
  projectIds: string[] | null
): RetrievedChunk[] {
  if (!projectIds || projectIds.length === 0) return results;
  const allowed = new Set(projectIds);
  return results.filter((r) => allowed.has(r.project_id));
}

export async function buildProjectSummary(
  supabase: SupabaseClient,
  scopedProjectIds: string[] | null,
  resultProjectIds: string[]
): Promise<{ summary: string | null; labels: string[] }> {
  const targetIds =
    scopedProjectIds && scopedProjectIds.length === 1
      ? scopedProjectIds
      : resultProjectIds.length > 0
        ? resultProjectIds
        : scopedProjectIds ?? [];

  if (targetIds.length === 0) {
    return { summary: null, labels: [] };
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, client_name, project_name, last_summary')
    .in('id', targetIds);

  const labels = (projects ?? []).map((p) => `${p.client_name} · ${p.project_name}`);

  if (scopedProjectIds?.length === 1) {
    const project = projects?.[0];
    return {
      summary: project?.last_summary ?? null,
      labels,
    };
  }

  const summary = (projects ?? [])
    .map((p) => {
      if (!p.last_summary) return null;
      return `### ${p.client_name} · ${p.project_name}\n${p.last_summary}`;
    })
    .filter(Boolean)
    .join('\n\n');

  return { summary: summary || null, labels };
}

export function buildScopeInstruction(
  scopedProjectIds: string[] | null,
  projectLabels: string[]
): string | null {
  if (scopedProjectIds && scopedProjectIds.length === 1 && projectLabels.length === 1) {
    return `Search scope: ONLY the project "${projectLabels[0]}". Do not mention or infer information from any other project. If nothing relevant exists in this project, say so clearly.`;
  }

  if (scopedProjectIds && scopedProjectIds.length > 1 && projectLabels.length > 0) {
    const listed = projectLabels.join('", "');
    return `Search scope: ONLY these projects/workstreams: "${listed}". Do not mention or infer information from any other project. Label every finding with its client and project name.`;
  }

  if (!scopedProjectIds || scopedProjectIds.length === 0) {
    return 'Search scope: ALL projects. Label every finding with its client and project name. Do not mix up information between projects.';
  }

  return null;
}

export function chunksForAnswer(results: RetrievedChunk[], scopedProjectIds: string[] | null) {
  const labelProject = !scopedProjectIds || scopedProjectIds.length !== 1;
  return toSearchContext(results.slice(0, ANSWER_CONTEXT_CHUNK_LIMIT), { labelProject });
}
