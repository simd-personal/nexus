import type { SupabaseClient } from '@supabase/supabase-js';
import type { Citation } from '@/types/database';
import { recomputeProjectStatuses, recomputeProjectStatus } from '@/lib/projects/health';

export function buildFilesByProject(
  files: Array<{ project_id: string; file_name: string }>
): Map<string, Set<string>> {
  const filesByProject = new Map<string, Set<string>>();
  for (const file of files) {
    if (!filesByProject.has(file.project_id)) {
      filesByProject.set(file.project_id, new Set());
    }
    filesByProject.get(file.project_id)!.add(file.file_name);
  }
  return filesByProject;
}

function citationsReferenceFile(
  citations: Citation[] | null | undefined,
  fileId: string,
  fileName: string
): boolean {
  if (!citations?.length) return false;
  return citations.some(
    (citation) => citation.file_id === fileId || citation.file_name === fileName
  );
}

export function recordCitationsStillValid(
  record: { project_id: string; source_citations?: Citation[] | null },
  filesByProject: Map<string, Set<string>>
): boolean {
  const citations = record.source_citations ?? [];
  if (citations.length === 0) return true;

  const projectFiles = filesByProject.get(record.project_id);
  if (!projectFiles) return false;

  return citations.some((citation) => citation.file_name && projectFiles.has(citation.file_name));
}

export const sunnyUpdateStillValid = recordCitationsStillValid;

export async function pruneOrphanedDerivedRecords(
  supabase: SupabaseClient,
  filesByProject: Map<string, Set<string>>
): Promise<void> {
  const [{ data: sunnyUpdates }, { data: criticalItems }, { data: actionItems }] =
    await Promise.all([
      supabase.from('sunny_updates').select('id, project_id, source_citations'),
      supabase.from('critical_items').select('id, project_id, source_citations'),
      supabase.from('action_items').select('id, project_id, source_citations'),
    ]);

  const staleSunnyUpdateIds = (sunnyUpdates ?? [])
    .filter(
      (row) =>
        (row.source_citations as Citation[] | null)?.length &&
        !recordCitationsStillValid(row, filesByProject)
    )
    .map((row) => row.id);

  const staleCriticalRows = (criticalItems ?? []).filter(
    (row) =>
      (row.source_citations as Citation[] | null)?.length &&
      !recordCitationsStillValid(row, filesByProject)
  );
  const staleCriticalItemIds = staleCriticalRows.map((row) => row.id);

  const staleActionRows = (actionItems ?? []).filter(
    (row) =>
      (row.source_citations as Citation[] | null)?.length &&
      !recordCitationsStillValid(row, filesByProject)
  );
  const staleActionItemIds = staleActionRows.map((row) => row.id);

  const affectedProjectIds = new Set<string>([
    ...staleCriticalRows.map((row) => row.project_id),
    ...staleActionRows.map((row) => row.project_id),
  ]);

  if (staleSunnyUpdateIds.length > 0) {
    await supabase.from('sunny_updates').delete().in('id', staleSunnyUpdateIds);
  }

  if (staleCriticalItemIds.length > 0) {
    await supabase.from('critical_items').delete().in('id', staleCriticalItemIds);
  }

  if (staleActionItemIds.length > 0) {
    await supabase.from('action_items').delete().in('id', staleActionItemIds);
  }

  if (affectedProjectIds.size > 0) {
    await recomputeProjectStatuses(supabase, affectedProjectIds);
  }
}

/** Remove entity rows left behind when source files were deleted (FK ON DELETE SET NULL). */
export async function pruneOrphanedEntities(
  supabase: SupabaseClient,
  projectIds?: string[]
): Promise<void> {
  let query = supabase.from('entities').delete().is('source_file_id', null);

  if (projectIds?.length === 1) {
    query = query.eq('project_id', projectIds[0]!);
  } else if (projectIds && projectIds.length > 1) {
    query = query.in('project_id', projectIds);
  }

  await query;
}

export async function purgeFileDerivedContent(
  supabase: SupabaseClient,
  projectId: string,
  fileId: string,
  fileName: string
): Promise<void> {
  await supabase.from('chunks').delete().eq('file_id', fileId);
  await supabase.from('entities').delete().eq('source_file_id', fileId);
  await supabase.from('timeline_events').delete().eq('source_file_id', fileId);

  const [{ data: sunnyUpdates }, { data: criticalItems }, { data: actionItems }] =
    await Promise.all([
      supabase.from('sunny_updates').select('id, source_citations').eq('project_id', projectId),
      supabase.from('critical_items').select('id, source_citations').eq('project_id', projectId),
      supabase.from('action_items').select('id, source_citations').eq('project_id', projectId),
    ]);

  const sunnyUpdateIds = (sunnyUpdates ?? [])
    .filter((row) =>
      citationsReferenceFile(row.source_citations as Citation[], fileId, fileName)
    )
    .map((row) => row.id);

  if (sunnyUpdateIds.length > 0) {
    await supabase.from('sunny_updates').delete().in('id', sunnyUpdateIds);
  }

  const criticalItemIds = (criticalItems ?? [])
    .filter((row) =>
      citationsReferenceFile(row.source_citations as Citation[], fileId, fileName)
    )
    .map((row) => row.id);

  if (criticalItemIds.length > 0) {
    await supabase.from('critical_items').delete().in('id', criticalItemIds);
    await recomputeProjectStatus(supabase, projectId);
  }

  const actionItemIds = (actionItems ?? [])
    .filter((row) =>
      citationsReferenceFile(row.source_citations as Citation[], fileId, fileName)
    )
    .map((row) => row.id);

  if (actionItemIds.length > 0) {
    await supabase.from('action_items').delete().in('id', actionItemIds);
  }

  await pruneOrphanedEntities(supabase, [projectId]);
}
