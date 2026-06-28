import type { SupabaseClient } from '@supabase/supabase-js';
import type { Citation } from '@/types/database';

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

  if (staleSunnyUpdateIds.length > 0) {
    await supabase.from('sunny_updates').delete().in('id', staleSunnyUpdateIds);
  }

  const staleCriticalItemIds = (criticalItems ?? [])
    .filter(
      (row) =>
        (row.source_citations as Citation[] | null)?.length &&
        !recordCitationsStillValid(row, filesByProject)
    )
    .map((row) => row.id);

  if (staleCriticalItemIds.length > 0) {
    await supabase.from('critical_items').delete().in('id', staleCriticalItemIds);
  }

  const staleActionItemIds = (actionItems ?? [])
    .filter(
      (row) =>
        (row.source_citations as Citation[] | null)?.length &&
        !recordCitationsStillValid(row, filesByProject)
    )
    .map((row) => row.id);

  if (staleActionItemIds.length > 0) {
    await supabase.from('action_items').delete().in('id', staleActionItemIds);
  }
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
  }

  const actionItemIds = (actionItems ?? [])
    .filter((row) =>
      citationsReferenceFile(row.source_citations as Citation[], fileId, fileName)
    )
    .map((row) => row.id);

  if (actionItemIds.length > 0) {
    await supabase.from('action_items').delete().in('id', actionItemIds);
  }
}
