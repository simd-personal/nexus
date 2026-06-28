import { extractActionItems, type NormalizedActionItem } from '@/lib/ai/sunny';
import { createServiceClient } from '@/lib/supabase/admin';
import type { SourceType } from '@/types/database';
import {
  capActionItems,
  filterActionItemsForWatchlist,
  formatWatchlistForPrompt,
  loadWatchlistContext,
} from './watchlist';

export async function extractRelevantActionItems(
  projectId: string,
  userId: string,
  text: string,
  fileName: string,
  sourceType?: SourceType
): Promise<NormalizedActionItem[]> {
  const supabase = createServiceClient();
  const watchlist = await loadWatchlistContext(supabase, projectId, userId);
  const extracted = await extractActionItems(text, fileName, {
    watchlistPrompt: formatWatchlistForPrompt(watchlist),
    sourceType,
  });
  return capActionItems(filterActionItemsForWatchlist(extracted, watchlist), sourceType);
}
