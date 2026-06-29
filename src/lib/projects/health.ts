import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProjectStatus, Severity } from '@/types/database';

type OpenCriticalRow = { severity: Severity | string };

export function computeProjectStatus(
  openCriticalItems: OpenCriticalRow[],
  options?: { hasFailedFiles?: boolean }
): ProjectStatus {
  if (options?.hasFailedFiles) return 'needs_review';
  if (openCriticalItems.some((item) => item.severity === 'critical' || item.severity === 'high')) {
    return 'critical';
  }
  if (openCriticalItems.length > 0) return 'watch';
  return 'healthy';
}

export async function resolveProjectStatus(
  supabase: SupabaseClient,
  projectId: string
): Promise<ProjectStatus> {
  const [{ data: openItems }, { data: failedFiles }] = await Promise.all([
    supabase
      .from('critical_items')
      .select('severity')
      .eq('project_id', projectId)
      .eq('status', 'open'),
    supabase.from('files').select('id').eq('project_id', projectId).eq('status', 'failed').limit(1),
  ]);

  return computeProjectStatus(openItems ?? [], {
    hasFailedFiles: (failedFiles?.length ?? 0) > 0,
  });
}

/** Sync projects.status from open critical items and failed file state. */
export async function recomputeProjectStatus(
  supabase: SupabaseClient,
  projectId: string
): Promise<ProjectStatus> {
  const status = await resolveProjectStatus(supabase, projectId);
  await supabase.from('projects').update({ status }).eq('id', projectId);
  return status;
}

export async function recomputeProjectStatuses(
  supabase: SupabaseClient,
  projectIds: Iterable<string>
): Promise<void> {
  const unique = [...new Set(projectIds)];
  await Promise.all(unique.map((projectId) => recomputeProjectStatus(supabase, projectId)));
}
