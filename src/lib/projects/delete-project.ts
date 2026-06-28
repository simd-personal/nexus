import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/admin';

const STORAGE_BATCH_SIZE = 100;

export interface DeleteProjectResult {
  error?: string;
  status?: number;
  deletedFiles?: number;
}

export async function deleteProjectAndFiles(
  supabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<DeleteProjectResult> {
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, owner_id, project_name, client_name')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    return { error: 'Project not found', status: 404 };
  }

  if (project.owner_id !== userId) {
    return { error: 'Forbidden', status: 403 };
  }

  const { data: files, error: filesError } = await supabase
    .from('files')
    .select('id, storage_path')
    .eq('project_id', projectId);

  if (filesError) {
    return { error: filesError.message, status: 500 };
  }

  const storagePaths = (files ?? [])
    .map((file) => file.storage_path)
    .filter((path): path is string => Boolean(path));

  if (storagePaths.length > 0) {
    const admin = createServiceClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'briefnexus-files';

    for (let i = 0; i < storagePaths.length; i += STORAGE_BATCH_SIZE) {
      const batch = storagePaths.slice(i, i + STORAGE_BATCH_SIZE);
      const { error: storageError } = await admin.storage.from(bucket).remove(batch);
      if (storageError) {
        console.error('Project storage delete error:', storageError.message);
      }
    }
  }

  const { error: deleteError } = await supabase.from('projects').delete().eq('id', projectId);
  if (deleteError) {
    return { error: deleteError.message, status: 500 };
  }

  return { deletedFiles: files?.length ?? 0 };
}
