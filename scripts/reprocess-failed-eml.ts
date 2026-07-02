/**
 * One-off: reprocess the two forwarded .eml files that failed on an OpenAI 429
 * (quota) error. Runs the real pipeline locally with no serverless time budget.
 *
 * Usage: tsx scripts/reprocess-failed-eml.ts
 */
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { processFile } from '../src/lib/processing/pipeline';
import type { SourceType } from '../src/types/database';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const FILE_IDS = [
  '78160121-6e39-42ac-b7cf-a997f8f914cb', // Upperdeck.dev Product Direction Note.eml
  '657d7244-5cf6-4785-aa55-fb7a8aaea909', // Sims buddy notes.eml
];

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'briefnexus-files';

  const { data: files, error } = await supabase
    .from('files')
    .select('id, project_id, file_name, status, storage_path, source_type')
    .in('id', FILE_IDS);

  if (error || !files) {
    throw new Error(error?.message ?? 'Could not load files');
  }

  for (const file of files) {
    if (!file.storage_path) {
      console.warn(`Skipping ${file.file_name}: no storage path`);
      continue;
    }

    console.log(`\n→ ${file.file_name} (currently: ${file.status})`);
    await supabase.from('chunks').delete().eq('file_id', file.id);
    await supabase.from('entities').delete().eq('source_file_id', file.id);

    const { data: blob, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(file.storage_path);

    if (downloadError || !blob) {
      throw new Error(`Download failed for ${file.file_name}: ${downloadError?.message}`);
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    const result = await processFile({
      fileId: file.id,
      projectId: file.project_id,
      fileName: file.file_name,
      sourceType: file.source_type as SourceType,
      buffer,
    });
    console.log(`  pipeline result:`, JSON.stringify(result));
  }

  const { data: summary } = await supabase
    .from('files')
    .select('file_name, status, extracted_text')
    .in('id', FILE_IDS);

  console.log('\nFinal status:');
  for (const row of summary ?? []) {
    console.log(
      `- ${row.file_name}: ${row.status} (${(row.extracted_text ?? '').length} chars)`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
