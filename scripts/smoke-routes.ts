/**
 * Quick smoke test for routes (run while dev server is up)
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(process.cwd(), '.env.local') });

const base = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: auth } = await supabase.auth.signInWithPassword({
    email: 'sim@test.com',
    password: 'admin',
  });

  if (!auth.session) {
    console.error('Auth failed');
    process.exit(1);
  }

  const token = auth.session.access_token;
  const headers = { Cookie: `sb-pvrrlgcmbmajrmpowxoq-auth-token=base64-${Buffer.from(JSON.stringify(auth.session)).toString('base64')}` };

  const routes = [
    '/dashboard',
    '/search',
    '/sunny',
    '/api/chat/sessions?type=search',
    '/api/search/stream',
    '/api/chat/stream',
  ];

  for (const path of routes) {
    const method = path.includes('/stream') ? 'POST' : 'GET';
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: method === 'POST' ? JSON.stringify({ query: 'test', message: 'test', project_id: 'test' }) : undefined,
      redirect: 'manual',
    });
    console.log(`${res.status} ${method} ${path}`);
  }
}

main().catch(console.error);
