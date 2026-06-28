/**
 * Verifies Supabase + auth connection for BriefNexus.
 * Usage: npm run test-connection
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  console.log('BriefNexus connection test\n');
  console.log(`✓ Supabase URL: ${url}`);

  // Auth test
  const authClient = createClient(url, anonKey);
  const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
    email: 'sim@test.com',
    password: 'admin',
  });

  if (authError || !authData.session) {
    console.error('❌ Auth failed:', authError?.message ?? 'No session');
    process.exit(1);
  }
  console.log('✓ Demo login works (sim@test.com)');

  // Data test (as authenticated user)
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } },
  });

  const { data: projects, error: projectsError } = await userClient
    .from('projects')
    .select('id, client_name, project_name, status')
    .order('last_activity_at', { ascending: false });

  if (projectsError) {
    console.error('❌ Projects query failed:', projectsError.message);
    process.exit(1);
  }

  console.log(`✓ Projects visible: ${projects?.length ?? 0}`);
  for (const p of projects ?? []) {
    console.log(`   • ${p.client_name} — ${p.project_name} (${p.status})`);
  }

  const { count: criticalCount } = await userClient
    .from('critical_items')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open');

  const { count: updateCount } = await userClient
    .from('sunny_updates')
    .select('*', { count: 'exact', head: true });

  console.log(`✓ Sunny updates: ${updateCount ?? 0}`);
  console.log(`✓ Open critical items: ${criticalCount ?? 0}`);

  if (!serviceKey || serviceKey.includes('your-service-role')) {
    console.log('\n⚠ SUPABASE_SERVICE_ROLE_KEY not set — file upload AI processing will not work');
    console.log('  Add it from Supabase → Settings → API → service_role');
  } else {
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: buckets } = await admin.storage.listBuckets();
    const bucket = buckets?.find((b) => b.name === (process.env.SUPABASE_STORAGE_BUCKET || 'briefnexus-files'));
    console.log(bucket ? `✓ Storage bucket: ${bucket.name}` : '⚠ Storage bucket briefnexus-files not found');
  }

  console.log('\n✅ Supabase is connected. Sign in at http://localhost:3000/login');
  console.log('   Demo: sim@test.com / admin');
}

main().catch(console.error);
