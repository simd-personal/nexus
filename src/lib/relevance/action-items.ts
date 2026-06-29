import type { ActionItem } from '@/types/database';
import { ownerMatchesUser, type WatchlistContext } from '@/lib/relevance/watchlist';

const RELEVANT_KINDS = new Set(['commitment', 'decision', 'risk']);

const NOISE_TITLE_PATTERNS = [
  /limited stock/i,
  /unsubscribe/i,
  /%\s*off/i,
  /gun torch/i,
  /receipt for travel/i,
  /check this out/i,
  /marketing email/i,
  /order confirmation/i,
];

export type ActionItemRelevanceFields = Pick<
  ActionItem,
  'title' | 'owner' | 'item_kind' | 'applies_to_me' | 'matched_terms' | 'status'
>;

export function isNoiseActionTitle(title: string): boolean {
  return NOISE_TITLE_PATTERNS.some((pattern) => pattern.test(title));
}

/** Items shown in counts and "your actions" lists — excludes legacy noise without deleting rows. */
export function isRelevantOpenActionItem(item: ActionItemRelevanceFields): boolean {
  if (item.status !== 'open' || !item.applies_to_me) return false;
  if (item.item_kind === 'informational') return false;
  if (isNoiseActionTitle(item.title)) return false;
  if (item.item_kind && RELEVANT_KINDS.has(item.item_kind)) return true;
  return false;
}

export function filterRelevantOpenActionItems<T extends ActionItemRelevanceFields>(items: T[]): T[] {
  return items.filter(isRelevantOpenActionItem);
}

export function resolveAppliesToMe(
  item: { owner?: string | null; applies_to_me?: boolean },
  ctx: WatchlistContext
): boolean {
  if (ownerMatchesUser(item.owner ?? '', ctx)) return true;
  return item.applies_to_me === true;
}
