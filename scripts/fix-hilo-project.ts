/**
 * Dedupe duplicate uploads and reprocess HILO Action Plans spreadsheets.
 *
 * Usage: tsx scripts/fix-hilo-project.ts
 */
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { deleteProjectFile } from '../src/lib/files/delete-file';
import { processFile } from '../src/lib/processing/pipeline';
import type { SourceType } from '../src/types/database';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PROJECT_ID = 'c73baef6-3f74-485e-86da-4a62b25bf109';
const KEEP_FILE_IDS = new Set([
  '6637285e-463b-42b0-af5f-7e39a8ea9de7', // PB_Denial_Actions_Plan
  '6dfea493-7f70-432a-ae2a-e53fd650c2c7', // HB_Denials_Action_Plan
]);

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

  console.log(`Found ${files.length} files in HILO Action Plans`);

  for (const file of files) {
    if (KEEP_FILE_IDS.has(file.id)) continue;
    console.log(`Deleting duplicate/stuck file: ${file.file_name} (${file.id})`);
    const result = await deleteProjectFile(supabase, file.id);
    if (result.error) {
      throw new Error(`Delete failed for ${file.id}: ${result.error}`);
    }
  }

  const { data: remaining } = await supabase
    .from('files')
    .select('id, file_name, status, storage_path, source_type, project_id')
    .eq('project_id', PROJECT_ID)
    .order('created_at', { ascending: true });

  for (const file of remaining ?? []) {
    console.log(`Reprocessing ${file.file_name}...`);
    await supabase.from('chunks').delete().eq('file_id', file.id);
    await supabase.from('entities').delete().eq('source_file_id', file.id);

    if (!file.storage_path) {
      console.warn(`Skipping ${file.file_name}: no storage path`);
      continue;
    }

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
    console.log(`Processed ${file.file_name}`);
  }

  const { data: summary } = await supabase
    .from('files')
    .select('file_name, status')
    .eq('project_id', PROJECT_ID);

  console.log('\nFinal file status:');
  for (const row of summary ?? []) {
    console.log(`- ${row.file_name}: ${row.status}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
