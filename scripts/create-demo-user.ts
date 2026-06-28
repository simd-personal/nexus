/**
 * Creates or resets shared premium demo accounts via Supabase Admin API.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage: npm run create-demo-user
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { PREMIUM_TEST_ACCOUNTS } from '../src/lib/billing/test-accounts';

config({ path: resolve(process.cwd(), '.env.local') });

async function ensurePremiumProfile(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  fullName: string
) {
  const { error } = await supabase.from('profiles').upsert(
    {
      user_id: userId,
      full_name: fullName,
      account_type: 'individual',
      plan: 'pro',
      subscription_status: 'active',
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    console.error('❌ Failed to set premium profile:', error.message);
    process.exit(1);
  }

  console.log('  ✓ Premium plan: unlimited projects and Sunny chat');
}

async function ensureDemoUser(
  supabase: ReturnType<typeof createClient>,
  account: (typeof PREMIUM_TEST_ACCOUNTS)[number]
) {
  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email?.toLowerCase() === account.email);

  let userId: string;

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: account.password,
      email_confirm: true,
      user_metadata: { full_name: account.fullName },
    });
    if (error) {
      console.error(`❌ Failed to update ${account.email}:`, error.message);
      process.exit(1);
    }
    userId = existing.id;
    console.log(`✓ Reset demo user: ${account.email}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: { full_name: account.fullName },
    });
    if (error || !data.user) {
      console.error(`❌ Failed to create ${account.email}:`, error?.message ?? 'No user returned');
      process.exit(1);
    }
    userId = data.user.id;
    console.log(`✓ Created demo user: ${account.email}`);
  }

  await ensurePremiumProfile(supabase, userId, account.fullName);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey || serviceKey.includes('your-service-role')) {
    console.error('❌ Set SUPABASE_SERVICE_ROLE_KEY in .env.local first.');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const account of PREMIUM_TEST_ACCOUNTS) {
    await ensureDemoUser(supabase, account);
  }

  console.log('\nDemo logins:');
  for (const account of PREMIUM_TEST_ACCOUNTS) {
    console.log(`  ${account.fullName}: ${account.email} / ${account.password}`);
  }
  console.log('\nThen run: npm run seed');
}

main().catch(console.error);
