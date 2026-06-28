import { createServiceClient } from '@/lib/supabase/admin';

interface FileContentSource {
  storage_path: string | null;
  extracted_text: string | null;
}

export async function loadFileContent(
  file: FileContentSource
): Promise<{ buffer?: Buffer; pastedText?: string }> {
  if (file.storage_path) {
    const supabase = createServiceClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'briefnexus-files';
    const { data: blob, error } = await supabase.storage
      .from(bucket)
      .download(file.storage_path);

    if (error || !blob) {
      throw new Error(error?.message ?? 'Could not download file from storage');
    }

    return { buffer: Buffer.from(await blob.arrayBuffer()) };
  }

  const pastedText = file.extracted_text?.trim();
  if (pastedText) {
    return { pastedText };
  }

  throw new Error('No file content available to process');
}
