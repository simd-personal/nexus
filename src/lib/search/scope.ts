import type { SupabaseClient } from '@supabase/supabase-js';
import type { RetrievedChunk } from './retrieve';
import { toSearchContext } from './retrieve';

export function normalizeProjectId(projectId?: string | null): string | null {
  const trimmed = projectId?.trim();
  return trimmed ? trimmed : null;
}

export function filterResultsToProject(
  results: RetrievedChunk[],
  projectId: string | null
): RetrievedChunk[] {
  if (!projectId) return results;
  return results.filter((r) => r.project_id === projectId);
}

export async function buildProjectSummary(
  supabase: SupabaseClient,
  scopedProjectId: string | null,
  resultProjectIds: string[]
): Promise<{ summary: string | null; label: string | null }> {
  if (scopedProjectId) {
    const { data: project } = await supabase
      .from('projects')
      .select('client_name, project_name, last_summary')
      .eq('id', scopedProjectId)
      .single();

    return {
      summary: project?.last_summary ?? null,
      label: project ? `${project.client_name} — ${project.project_name}` : null,
    };
  }

  if (resultProjectIds.length === 0) {
    return { summary: null, label: null };
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, client_name, project_name, last_summary')
    .in('id', resultProjectIds);

  const summary = (projects ?? [])
    .map((p) => {
      if (!p.last_summary) return null;
      return `### ${p.client_name} — ${p.project_name}\n${p.last_summary}`;
    })
    .filter(Boolean)
    .join('\n\n');

  return { summary: summary || null, label: null };
}

export function buildScopeInstruction(
  scopedProjectId: string | null,
  projectLabel: string | null
): string | null {
  if (scopedProjectId && projectLabel) {
    return `Search scope: ONLY the project "${projectLabel}". Do not mention or infer information from any other project. If nothing relevant exists in this project, say so clearly.`;
  }
  if (!scopedProjectId) {
    return 'Search scope: ALL projects. Label every finding with its client and project name. Do not mix up information between projects.';
  }
  return null;
}

export function chunksForAnswer(results: RetrievedChunk[], scopedProjectId: string | null) {
  return toSearchContext(results.slice(0, 12), { labelProject: !scopedProjectId });
}
