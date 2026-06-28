/**
 * BriefNexus Seed Script
 *
 * Seeds demo projects with realistic long-form transcripts, PDFs, emails, and notes.
 *
 * Usage:
 *   npm run seed              # skip projects that already exist
 *   npm run seed:rich         # same as seed (rich dataset is default)
 *   npm run seed -- --reset   # delete seed projects and re-import all files
 *
 * Requires: demo user (npm run create-demo-user) and .env.local service role key.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { ensureSeedPdfs } from './lib/build-seed-pdfs';
import {
  deleteSeedProjects,
  seedProjectFiles,
} from './lib/seed-helpers';
import { RICH_SEED_PROJECTS } from './seed-projects';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const DEMO_EMAIL = process.env.SEED_USER_EMAIL || 'sim@test.com';
const reset = process.argv.includes('--reset');

async function seed() {
  console.log('🌱 Seeding BriefNexus demo data...\n');
  if (reset) console.log('   Mode: --reset (replacing existing seed projects)\n');

  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users?.find((u) => u.email === DEMO_EMAIL);

  if (!user) {
    console.error(`❌ User ${DEMO_EMAIL} not found.`);
    console.error('   Run: npm run create-demo-user');
    process.exit(1);
  }

  console.log(`✓ Found user: ${user.email}\n`);
  console.log('📑 Building PDF fixtures if needed...');
  await ensureSeedPdfs();

  const projectNames = RICH_SEED_PROJECTS.map((p) => p.projectName);

  if (reset) {
    await deleteSeedProjects(supabase, user.id, projectNames);
  }

  for (const spec of RICH_SEED_PROJECTS) {
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('owner_id', user.id)
      .eq('project_name', spec.projectName)
      .maybeSingle();

    if (existing && !reset) {
      console.log(`⚠ Skipping "${spec.projectName}" — already exists (${existing.id})`);
      continue;
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        owner_id: user.id,
        client_name: spec.clientName,
        project_name: spec.projectName,
        description: spec.description,
        status: spec.status,
      })
      .select()
      .single();

    if (projectError || !project) {
      console.error(`❌ Failed to create ${spec.projectName}:`, projectError?.message);
      continue;
    }

    console.log(`\n✓ Created project: ${spec.clientName} — ${spec.projectName} (${project.id})`);
    console.log(`  Files: ${spec.files.length} (transcripts, PDFs, emails, notes)`);

    await seedProjectFiles(supabase, project.id, user.id, spec.files);
  }

  console.log('\n✅ Seed complete!\n');
  console.log('Sample Sunny prompts:');
  console.log('  Acme: "What is the July 15 gate Maria Santos owns?"');
  console.log('  Acme: "Summarize Denver hiring risks from site visit notes"');
  console.log('  Adventist: "Did anyone send an email that contradicts the morning meeting?"');
  console.log('  Adventist: "Pull out action items and add them"');
  console.log('\nOpen http://localhost:3000/projects and explore both clients.');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
