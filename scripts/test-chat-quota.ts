/**
 * End-to-end test for the free-tier chat quota wall.
 *
 * Creates a fresh free user, verifies chat works under the limit, seeds the
 * user up to FREE_CHAT_MESSAGES_PER_MONTH user messages, and asserts the next
 * chat request is rejected with HTTP 402 + an upgrade link. Cleans up after.
 *
 * Requires the dev server running (npm run dev) and SUPABASE_SERVICE_ROLE_KEY.
 * Usage: npm run test:quota
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { randomUUID } from 'crypto';
import { createClient, type Session } from '@supabase/supabase-js';
import { FREE_CHAT_MESSAGES_PER_MONTH } from '../src/lib/billing/plans';

config({ path: resolve(process.cwd(), '.env.local') });

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';

function authCookie(session: Session): string {
  const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0];
  const key = `sb-${ref}-auth-token`;
  const base64url = Buffer.from(JSON.stringify(session), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${key}=base64-${base64url}`;
}

async function callSearchStream(cookie: string, query: string): Promise<Response> {
  const controller = new AbortController();
  const res = await fetch(`${BASE}/api/search/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ query }),
    signal: controller.signal,
  });
  // Abort as soon as we have the status — we only care about the quota gate,
  // not the AI answer.
  controller.abort();
  return res;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !serviceKey || !anonKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and anon key required');
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const email = `quota-smoke-${Date.now()}@example.com`;
  const password = `Quota-${randomUUID()}`;

  console.log(`Free chat quota test → ${BASE}`);
  console.log(`Creating free user ${email}\n`);

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Quota Smoke' },
  });
  if (createError || !created.user) {
    console.error('❌ Could not create user:', createError?.message);
    process.exit(1);
  }
  const userId = created.user.id;

  let failed = false;

  try {
    // Profile is created by trigger; make sure it is on the free plan.
    await admin
      .from('profiles')
      .upsert({ user_id: userId, plan: 'free', subscription_status: null, account_type: 'individual' }, { onConflict: 'user_id' });

    const userClient = createClient(url, anonKey);
    const { data: auth, error: signInError } = await userClient.auth.signInWithPassword({ email, password });
    if (signInError || !auth.session) throw new Error(`Sign-in failed: ${signInError?.message}`);
    const cookie = authCookie(auth.session);
    console.log('✓ Signed in as free user');

    // 1. Under the limit: chat must NOT be quota-blocked.
    const before = await callSearchStream(cookie, 'Hello Sunny, quota smoke test');
    if (before.status === 402) {
      console.log('✗ Chat blocked at 0 messages (should be allowed)');
      failed = true;
    } else {
      console.log(`✓ Chat allowed with 0 messages this month (HTTP ${before.status})`);
    }

    // 2. Seed a session with FREE_CHAT_MESSAGES_PER_MONTH user messages
    //    (project_id null — the global Sunny search chat surface).
    const sessionId = randomUUID();
    const { error: sessionError } = await userClient.from('chat_sessions').insert({
      id: sessionId,
      owner_id: userId,
      project_id: null,
      session_type: 'search',
      title: 'Quota smoke session',
    });
    if (sessionError) throw new Error(`Session insert failed: ${sessionError.message}`);

    const rows = Array.from({ length: FREE_CHAT_MESSAGES_PER_MONTH }, (_, i) => ({
      session_id: sessionId,
      project_id: null,
      role: 'user',
      content: `Quota smoke message ${i + 1}`,
    }));
    const { error: messagesError } = await userClient.from('chat_messages').insert(rows);
    if (messagesError) throw new Error(`Message seed failed: ${messagesError.message}`);
    console.log(`✓ Seeded ${FREE_CHAT_MESSAGES_PER_MONTH} user messages this month`);

    // 3. At the limit: next request must be 402 with an upgrade link.
    const blocked = await fetch(`${BASE}/api/search/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ query: 'One more message past the limit' }),
    });

    if (blocked.status !== 402) {
      console.log(`✗ Expected HTTP 402 after ${FREE_CHAT_MESSAGES_PER_MONTH} messages, got ${blocked.status}`);
      failed = true;
    } else {
      const body = await blocked.json();
      const hasUpgrade = body.upgradeRequired === true && String(body.error).includes('/upgrade?plan=pro');
      if (hasUpgrade) {
        console.log('✓ 26th message blocked with 402 + upgrade link');
        console.log(`  → "${body.error}"`);
      } else {
        console.log('✗ 402 returned but payload missing upgradeRequired/upgrade link:', JSON.stringify(body));
        failed = true;
      }
    }

    // 4. Project chat surface must be gated by the same quota (the route
    //    resolves the project before the quota check, so create a real one).
    const { data: project, error: projectError } = await userClient
      .from('projects')
      .insert({ owner_id: userId, client_name: 'Quota Smoke', project_name: 'Quota Smoke Project' })
      .select('id')
      .single();
    if (projectError || !project) throw new Error(`Project insert failed: ${projectError?.message}`);

    const chatBlocked = await fetch(`${BASE}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ project_id: project.id, message: 'Blocked here too?' }),
    });
    if (chatBlocked.status === 402) {
      console.log('✓ Project chat stream also blocked with 402');
    } else {
      console.log(`✗ Project chat stream expected 402, got ${chatBlocked.status}`);
      failed = true;
    }
  } catch (error) {
    console.error('❌', error instanceof Error ? error.message : error);
    failed = true;
  } finally {
    await admin.auth.admin.deleteUser(userId);
    console.log('\n✓ Cleaned up test user');
  }

  console.log(failed ? '\n❌ Quota flow FAILED' : '\n✅ Free 25-message quota wall is wired in');
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
