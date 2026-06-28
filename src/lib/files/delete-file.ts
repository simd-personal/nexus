import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/admin';

export async function deleteProjectFile(
  supabase: SupabaseClient,
  fileId: string
): Promise<{ error?: string; status?: number }> {
  const { data: file, error } = await supabase
    .from('files')
    .select('id, storage_path, project_id')
    .eq('id', fileId)
    .single();

  if (error || !file) {
    return { error: 'File not found', status: 404 };
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'briefnexus-files';

  if (file.storage_path) {
    const admin = createServiceClient();
    const { error: storageError } = await admin.storage.from(bucket).remove([file.storage_path]);
    if (storageError) {
      console.error('Storage delete error:', storageError.message);
    }
  }

  const { error: deleteError } = await supabase.from('files').delete().eq('id', fileId);
  if (deleteError) {
    return { error: deleteError.message, status: 500 };
  }

  return {};
}
