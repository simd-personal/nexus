import { createClient } from '@supabase/supabase-js';

// Service role client — server-side only. Never expose to browser.
// Used for file processing pipeline and admin operations.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
