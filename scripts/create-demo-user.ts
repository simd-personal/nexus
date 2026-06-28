/**
 * Creates or resets the shared demo account via Supabase Admin API.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage: npm run create-demo-user
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(process.cwd(), '.env.local') });

const DEMO_EMAIL = 'sim@test.com';
const DEMO_PASSWORD = 'admin1234';
const DEMO_NAME = 'Sim Demo';

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

  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email === DEMO_EMAIL);

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: DEMO_NAME },
    });
    if (error) {
      console.error('❌ Failed to update demo user:', error.message);
      process.exit(1);
    }
    console.log(`✓ Reset demo user: ${DEMO_EMAIL}`);
  } else {
    const { error } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: DEMO_NAME },
    });
    if (error) {
      console.error('❌ Failed to create demo user:', error.message);
      process.exit(1);
    }
    console.log(`✓ Created demo user: ${DEMO_EMAIL}`);
  }

  console.log('\nDemo login:');
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log('\nThen run: npm run seed');
}

main().catch(console.error);
