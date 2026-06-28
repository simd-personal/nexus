import type { SupabaseClient } from '@supabase/supabase-js';
import type { Citation } from '@/types/database';

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

export function sunnyUpdateStillValid(
  update: { project_id: string; source_citations?: Citation[] | null },
  filesByProject: Map<string, Set<string>>
): boolean {
  const citations = update.source_citations ?? [];
  if (citations.length === 0) return true;

  const projectFiles = filesByProject.get(update.project_id);
  if (!projectFiles) return false;

  return citations.some((citation) => citation.file_name && projectFiles.has(citation.file_name));
}
