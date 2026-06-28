/**
 * Backfill vector embeddings for chunks missing them.
 * Usage: npm run backfill-embeddings
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { createEmbeddings } from '../src/lib/ai/openai';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const { data: chunks, error } = await supabase
    .from('chunks')
    .select('id, text')
    .is('embedding', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to load chunks:', error.message);
    process.exit(1);
  }

  if (!chunks?.length) {
    console.log('✓ All chunks already have embeddings.');
    return;
  }

  console.log(`Embedding ${chunks.length} chunks...`);

  const batchSize = 20;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const embeddings = await createEmbeddings(batch.map((c) => c.text));

    for (let j = 0; j < batch.length; j++) {
      const { error: updateError } = await supabase
        .from('chunks')
        .update({ embedding: embeddings[j] })
        .eq('id', batch[j].id);

      if (updateError) {
        console.error(`Failed chunk ${batch[j].id}:`, updateError.message);
      }
    }

    console.log(`  ${Math.min(i + batchSize, chunks.length)}/${chunks.length}`);
  }

  console.log('✅ Embeddings backfill complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
