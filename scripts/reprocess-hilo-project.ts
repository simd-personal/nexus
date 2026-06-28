/**
 * Reprocess all files in HILO Action Plans with improved spreadsheet extraction.
 *
 * Usage: tsx scripts/reprocess-hilo-project.ts
 */
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { processFile } from '../src/lib/processing/pipeline';
import type { SourceType } from '../src/types/database';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PROJECT_ID = 'c73baef6-3f74-485e-86da-4a62b25bf109';

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'briefnexus-files';

  const { data: files, error } = await supabase
    .from('files')
    .select('id, file_name, status, storage_path, source_type')
    .eq('project_id', PROJECT_ID)
    .order('created_at', { ascending: true });

  if (error || !files) {
    throw new Error(error?.message ?? 'Could not load project files');
  }

  console.log(`Reprocessing ${files.length} HILO Action Plans files...\n`);

  for (const file of files) {
    if (!file.storage_path) {
      console.warn(`Skipping ${file.file_name}: no storage path`);
      continue;
    }

    console.log(`→ ${file.file_name} (${file.status})`);
    await supabase.from('chunks').delete().eq('file_id', file.id);
    await supabase.from('entities').delete().eq('source_file_id', file.id);

    const { data: blob, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(file.storage_path);

    if (downloadError || !blob) {
      throw new Error(`Download failed for ${file.file_name}: ${downloadError?.message}`);
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    await processFile({
      fileId: file.id,
      projectId: PROJECT_ID,
      fileName: file.file_name,
      sourceType: file.source_type as SourceType,
      buffer,
    });
    console.log(`  done`);
  }

  const { data: summary } = await supabase
    .from('files')
    .select('file_name, status, LENGTH(COALESCE(extracted_text, \'\')) AS text_len')
    .eq('project_id', PROJECT_ID);

  const { count: chunkCount } = await supabase
    .from('chunks')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', PROJECT_ID);

  const { count: actionCount } = await supabase
    .from('action_items')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', PROJECT_ID);

  console.log('\nFinal status:');
  for (const row of summary ?? []) {
    console.log(`- ${row.file_name}: ${row.status} (${row.text_len} chars extracted)`);
  }
  console.log(`\nChunks: ${chunkCount ?? 0}, Action items: ${actionCount ?? 0}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
