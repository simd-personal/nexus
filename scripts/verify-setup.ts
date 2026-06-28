/**
 * Checks that .env.local is filled in before running the app.
 * Usage: npm run verify-setup
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const PLACEHOLDER_PATTERNS = [
  'your-project',
  'your-anon',
  'your-service-role',
  'your-openai',
  'your-anthropic',
  'sk-your-',
  'sk-ant-your-',
];

function isPlaceholder(value: string | undefined): boolean {
  if (!value?.trim()) return true;
  const lower = value.toLowerCase();
  return PLACEHOLDER_PATTERNS.some((p) => lower.includes(p));
}

const required: Array<{ key: string; hint: string }> = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL', hint: 'Supabase → Settings → API → Project URL' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', hint: 'Supabase → Settings → API → anon public key' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', hint: 'Supabase → Settings → API → service_role key (secret)' },
  { key: 'OPENAI_API_KEY', hint: 'https://platform.openai.com/api-keys' },
  { key: 'ANTHROPIC_API_KEY', hint: 'https://console.anthropic.com/settings/keys' },
];

const optional: Array<{ key: string; default: string }> = [
  { key: 'SUPABASE_STORAGE_BUCKET', default: 'briefnexus-files' },
];

console.log('BriefNexus setup check\n');

let ok = true;

for (const { key, hint } of required) {
  const value = process.env[key];
  if (isPlaceholder(value)) {
    console.log(`❌ ${key}`);
    console.log(`   → ${hint}\n`);
    ok = false;
  } else {
    console.log(`✓  ${key}`);
  }
}

for (const { key, default: def } of optional) {
  const value = process.env[key] || def;
  console.log(`✓  ${key} (${value})`);
}

console.log('\nDatabase (already applied on Supabase cloud):');
console.log('  1. supabase/migrations/001_initial_schema.sql');
console.log('  2. supabase/migrations/002_storage_bucket.sql');
console.log('  3. supabase/migrations/003_fix_search.sql');
console.log('  4. supabase/migrations/004_chat_sessions.sql');

if (!ok) {
  console.log('\n⚠ Edit .env.local with real values, then run this again.');
  process.exit(1);
}

console.log('\n✅ Env looks good. Next:');
console.log('   npm run dev');
console.log('   → Sign up at http://localhost:3000/login');
console.log('   → SEED_USER_EMAIL=you@email.com npm run seed  (optional demo data)');
