import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SourceType } from '../../src/types/database';
import { processFile } from '../../src/lib/processing/pipeline';

export const SEED_FIXTURES_DIR = join(process.cwd(), 'scripts/fixtures/seed');

export interface SeedFileSpec {
  fileName: string;
  fixturePath?: string;
  pastedText?: string;
  mimeType: string;
  sourceType: SourceType;
}

export interface SeedProjectSpec {
  clientName: string;
  projectName: string;
  description: string;
  status: 'active' | 'watch' | 'critical' | 'archived';
  files: SeedFileSpec[];
}

export function loadFixture(relativePath: string): Buffer {
  const fullPath = join(SEED_FIXTURES_DIR, relativePath);
  if (!existsSync(fullPath)) {
    throw new Error(`Missing seed fixture: ${relativePath}`);
  }
  return readFileSync(fullPath);
}

export function loadFixtureText(relativePath: string): string {
  return loadFixture(relativePath).toString('utf-8');
}

export async function seedProjectFiles(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  files: SeedFileSpec[]
): Promise<void> {
  for (const spec of files) {
    console.log(`\n📄 Processing: ${spec.fileName}...`);

    const { data: fileRecord, error: fileError } = await supabase
      .from('files')
      .insert({
        project_id: projectId,
        uploaded_by: userId,
        file_name: spec.fileName,
        file_type: spec.mimeType,
        source_type: spec.sourceType,
        status: 'pending',
      })
      .select()
      .single();

    if (fileError || !fileRecord) {
      console.error(`   ❌ Failed to create file record: ${fileError?.message}`);
      continue;
    }

    const buffer = spec.fixturePath ? loadFixture(spec.fixturePath) : undefined;

    await processFile({
      fileId: fileRecord.id,
      projectId,
      fileName: spec.fileName,
      sourceType: spec.sourceType,
      buffer,
      pastedText: spec.pastedText,
    });

    const size = buffer?.length ?? spec.pastedText?.length ?? 0;
    console.log(`   ✓ Processed (${size.toLocaleString()} bytes)`);
  }
}

export async function deleteSeedProjects(
  supabase: SupabaseClient,
  userId: string,
  projectNames: string[]
): Promise<void> {
  const { data: projects } = await supabase
    .from('projects')
    .select('id, project_name')
    .eq('owner_id', userId)
    .in('project_name', projectNames);

  for (const project of projects ?? []) {
    console.log(`🗑 Removing existing project: ${project.project_name}`);
    await supabase.from('projects').delete().eq('id', project.id);
  }
}
