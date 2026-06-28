/**
 * Tests upload processing for transcripts, PDF, PNG, and JPG.
 * Usage: npm run test-uploads
 */

import { config } from 'dotenv';
import { resolve, join } from 'path';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { extractTextFromBuffer } from '../src/lib/processing/extract';
import { processFile } from '../src/lib/processing/pipeline';
import { inferSourceType } from '../src/lib/constants';

config({ path: resolve(process.cwd(), '.env.local') });

const FIXTURES = join(process.cwd(), 'scripts/fixtures');

async function ensureImageFixtures() {
  const pngPath = join(FIXTURES, 'sample-slide.png');
  const jpgPath = join(FIXTURES, 'sample-slide.jpg');
  const pdfPath = join(FIXTURES, 'sample-document.pdf');

  if (existsSync(pngPath) && existsSync(jpgPath)) return { pngPath, jpgPath };

  mkdirSync(FIXTURES, { recursive: true });

  if (existsSync(pdfPath)) {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: readFileSync(pdfPath) });
    try {
      const shot = await parser.getScreenshot({ imageBuffer: true, scale: 2 });
      const page = shot.pages[0];
      if (page?.data) {
        writeFileSync(pngPath, Buffer.from(page.data));
        try {
          const { execSync } = await import('child_process');
          execSync(`sips -s format jpeg "${pngPath}" --out "${jpgPath}"`, { stdio: 'ignore' });
        } catch {
          writeFileSync(jpgPath, Buffer.from(page.data));
        }
        return { pngPath, jpgPath };
      }
    } finally {
      await parser.destroy();
    }
  }

  console.warn('⚠ Image fixtures missing — PNG/JPG tests may be skipped');
  return { pngPath, jpgPath };
}

async function testExtraction(name: string, fileName: string, mimeType?: string) {
  const path = join(FIXTURES, fileName);
  if (!existsSync(path)) {
    console.log(`⊘ ${name}: fixture missing (${fileName})`);
    return false;
  }

  const buffer = readFileSync(path);
  const sourceType = inferSourceType(fileName, mimeType);
  const { text } = await extractTextFromBuffer(buffer, fileName, mimeType);

  if (!text.trim()) {
    console.log(`✗ ${name}: no text extracted (source: ${sourceType})`);
    return false;
  }

  console.log(`✓ ${name}: extracted ${text.length} chars (source: ${sourceType})`);
  console.log(`   preview: ${text.replace(/\s+/g, ' ').slice(0, 100)}...`);
  return true;
}

async function testFullPipeline(
  supabase: ReturnType<typeof createClient>,
  projectId: string,
  userId: string,
  fileName: string,
  mimeType: string
) {
  const buffer = readFileSync(join(FIXTURES, fileName));
  const sourceType = inferSourceType(fileName, mimeType);

  const { data: fileRecord, error } = await supabase
    .from('files')
    .insert({
      project_id: projectId,
      uploaded_by: userId,
      file_name: fileName,
      file_type: mimeType,
      source_type: sourceType,
      status: 'pending',
    } as Record<string, unknown>)
    .select()
    .single();

  if (error || !fileRecord) {
    console.log(`✗ Pipeline ${fileName}: failed to create file record — ${error?.message}`);
    return false;
  }

  await processFile({
    fileId: fileRecord.id,
    projectId,
    fileName,
    sourceType,
    buffer,
  });

  const { data: file } = await supabase
    .from('files')
    .select('status, extracted_text')
    .eq('id', fileRecord.id)
    .single();

  const { count } = await supabase
    .from('chunks')
    .select('*', { count: 'exact', head: true })
    .eq('file_id', fileRecord.id);

  if (file?.status !== 'processed' || !file.extracted_text?.trim()) {
    console.log(`✗ Pipeline ${fileName}: status=${file?.status}`);
    return false;
  }

  console.log(`✓ Pipeline ${fileName}: processed, ${count ?? 0} chunks`);
  return true;
}

async function main() {
  console.log('BriefNexus upload format tests\n');

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY required for PDF/image extraction tests');
    process.exit(1);
  }

  await ensureImageFixtures();

  let passed = 0;
  let total = 0;

  const extractionTests: Array<[string, string, string?]> = [
    ['Transcript (.txt)', 'sample-transcript.txt', 'text/plain'],
    ['Transcript (.vtt)', 'sample-transcript.vtt', 'text/vtt'],
    ['PDF', 'sample-document.pdf', 'application/pdf'],
    ['PNG slide', 'sample-slide.png', 'image/png'],
    ['JPG slide', 'sample-slide.jpg', 'image/jpeg'],
  ];

  for (const [name, file, mime] of extractionTests) {
    total++;
    if (await testExtraction(name, file, mime)) passed++;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users?.find((u) => u.email === (process.env.SEED_USER_EMAIL || 'sim@test.com'));

  if (!user) {
    console.log('\n⚠ Skipping pipeline tests — demo user not found');
  } else {
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('owner_id', user.id)
      .order('last_activity_at', { ascending: false })
      .limit(1)
      .single();

    if (!project) {
      console.log('\n⚠ Skipping pipeline tests — no project found');
    } else {
      console.log('\nFull pipeline tests (DB + embeddings):\n');
      const pipelineTests: Array<[string, string]> = [
        ['sample-transcript.txt', 'text/plain'],
        ['sample-document.pdf', 'application/pdf'],
      ];

      if (existsSync(join(FIXTURES, 'sample-slide.png'))) {
        pipelineTests.push(['sample-slide.png', 'image/png']);
      }
      if (existsSync(join(FIXTURES, 'sample-slide.jpg'))) {
        pipelineTests.push(['sample-slide.jpg', 'image/jpeg']);
      }

      for (const [file, mime] of pipelineTests) {
        total++;
        if (await testFullPipeline(supabase, project.id, user.id, file, mime)) passed++;
      }
    }
  }

  console.log(`\n${passed}/${total} tests passed`);
  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
