import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  buildFilesByProject,
  pruneOrphanedDerivedRecords,
  recordCitationsStillValid,
  sunnyUpdateStillValid,
} from '@/lib/files/purge-derived-content';

/** Opt out of Next.js static caching for authenticated, user-specific data. */
export async function ensureFreshAppData(): Promise<void> {
  await connection();
}

export async function loadProjectFilesIndex(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: files } = await supabase.from('files').select('project_id, file_name');
  return buildFilesByProject(files ?? []);
}

export async function refreshDerivedRecords(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Map<string, Set<string>>> {
  const filesByProject = await loadProjectFilesIndex(supabase);
  await pruneOrphanedDerivedRecords(supabase, filesByProject);
  return filesByProject;
}

export {
  buildFilesByProject,
  recordCitationsStillValid,
  sunnyUpdateStillValid,
};
