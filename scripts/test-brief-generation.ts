/**
 * Live test: POST /api/generate type=brief and validate clean prose output.
 * Usage: npm run test:brief  (dev server must be running)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { validateBriefProse } from '@/lib/ai/brief-validation';

config({ path: resolve(process.cwd(), '.env.local') });

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const EMAIL = process.env.SEED_USER_EMAIL ?? 'sim@test.com';
const PASSWORD = process.env.SEED_USER_PASSWORD ?? 'admin';

function authCookie(session: { access_token: string; refresh_token: string; [key: string]: unknown }) {
  const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0];
  const key = `sb-${ref}-auth-token`;
  const base64url = Buffer.from(JSON.stringify(session), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${key}=base64-${base64url}`;
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (authErr) throw new Error(`Auth failed: ${authErr.message}`);

  const { data: projects } = await supabase.from('projects').select('id, project_name').limit(1);
  if (!projects?.length) throw new Error('No project found');

  const project = projects[0];
  const cookie = authCookie(auth.session!);

  console.log(`Testing brief generation for "${project.project_name}" (${project.id})`);
  console.log(`POST ${BASE}/api/generate (GPT 5.5, reasoning_effort: high)\n`);

  const res = await fetch(`${BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ project_id: project.id, type: 'brief' }),
  });

  const body = await res.text();
  if (res.status !== 200) {
    console.error(`✗ HTTP ${res.status}: ${body.slice(0, 400)}`);
    process.exit(1);
  }

  const { data } = JSON.parse(body) as { data: { title: string; content: string } };
  const issues = validateBriefProse(data.content);

  console.log(`Title: ${data.title}`);
  console.log(`Length: ${data.content.length} chars`);
  console.log('--- Preview ---');
  console.log(data.content.slice(0, 600));
  console.log('--- End preview ---\n');

  if (issues.length) {
    console.error(`✗ Format issues: ${issues.join(', ')}`);
    process.exit(1);
  }

  console.log('✓ Brief generation passed — clean prose, no markdown artifacts');
}

main().catch((err) => {
  console.error('✗', err instanceof Error ? err.message : err);
  process.exit(1);
});
