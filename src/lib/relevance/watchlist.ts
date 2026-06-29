import type { createServiceClient } from '@/lib/supabase/admin';
import type { SourceType } from '@/types/database';
import type { NormalizedActionItem } from '@/lib/ai/sunny';
import { isNoiseActionTitle } from '@/lib/relevance/action-items';

export type ActionItemKind = 'commitment' | 'decision' | 'informational' | 'risk';
export type ActionItemConfidence = 'high' | 'medium' | 'low';

export interface WatchlistContext {
  userName: string | null;
  userEmail: string | null;
  userEmailLocal: string | null;
  companyName: string | null;
  nameAliases: string[];
  accountKeywords: string[];
  projectClientName: string | null;
  projectName: string | null;
  projectKeywords: string[];
  projectRole: string | null;
}

export function parseKeywordList(input: string | null | undefined): string[] {
  if (!input?.trim()) return [];
  return input
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);
}

export function parseKeywordArray(values: string[] | null | undefined): string[] {
  return (values ?? []).map((value) => value.trim()).filter((value) => value.length >= 2);
}

export function collectWatchTerms(ctx: WatchlistContext): string[] {
  const terms = new Set<string>();

  const add = (value: string | null | undefined) => {
    const trimmed = value?.trim();
    if (trimmed && trimmed.length >= 2) terms.add(trimmed.toLowerCase());
  };

  add(ctx.userName);
  add(ctx.userEmailLocal);
  add(ctx.companyName);
  add(ctx.projectRole);
  for (const alias of ctx.nameAliases) add(alias);
  for (const keyword of ctx.accountKeywords) add(keyword);
  for (const keyword of ctx.projectKeywords) add(keyword);

  if (ctx.userName) {
    const firstName = ctx.userName.split(/\s+/)[0];
    if (firstName && firstName.length >= 2) terms.add(firstName.toLowerCase());
  }

  return [...terms];
}

export function findMatchedTerms(text: string, terms: string[]): string[] {
  const lower = text.toLowerCase();
  return terms.filter((term) => lower.includes(term));
}

export function ownerMatchesUser(owner: string, ctx: WatchlistContext): boolean {
  const lower = owner.toLowerCase();
  if (ctx.userName && lower.includes(ctx.userName.toLowerCase())) return true;

  for (const alias of ctx.nameAliases) {
    if (lower.includes(alias.toLowerCase())) return true;
  }

  if (ctx.userEmailLocal && lower.includes(ctx.userEmailLocal.toLowerCase())) return true;

  const firstName = ctx.userName?.split(/\s+/)[0];
  if (firstName && firstName.length >= 2 && lower.includes(firstName.toLowerCase())) return true;

  return false;
}

export function shouldSurfaceActionItem(
  item: Pick<
    NormalizedActionItem,
    'title' | 'description' | 'owner' | 'item_kind' | 'applies_to_me' | 'matched_terms' | 'confidence'
  >,
  ctx: WatchlistContext
): boolean {
  if (isNoiseActionTitle(item.title)) return false;
  if (item.item_kind === 'informational') return false;
  if (item.confidence === 'low') return false;

  const terms = collectWatchTerms(ctx);
  const searchable = [item.title, item.description, item.owner].filter(Boolean).join(' ');
  const matched =
    item.matched_terms && item.matched_terms.length > 0
      ? item.matched_terms.map((term) => term.toLowerCase())
      : findMatchedTerms(searchable, terms);

  const ownerMatch = ownerMatchesUser(item.owner ?? '', ctx);
  const hasRelevance = matched.length > 0 || ownerMatch;

  if (!hasRelevance) return false;

  if (ownerMatch) {
    return item.item_kind === 'commitment' || item.item_kind === 'decision' || item.item_kind === 'risk';
  }

  if (item.applies_to_me === true && (item.item_kind === 'commitment' || item.item_kind === 'decision')) {
    return matched.length > 0;
  }

  if (item.item_kind === 'commitment' || item.item_kind === 'decision') {
    return matched.length > 0;
  }

  if (item.item_kind === 'risk') {
    return ownerMatch;
  }

  return false;
}

export function filterActionItemsForWatchlist<T extends NormalizedActionItem>(
  items: T[],
  ctx: WatchlistContext
): T[] {
  return items.filter((item) => shouldSurfaceActionItem(item, ctx));
}

export function capActionItems<T>(items: T[], sourceType?: SourceType): T[] {
  const max =
    sourceType === 'transcript' || sourceType === 'meeting' || sourceType === 'note' ? 5 : 8;
  return items.slice(0, max);
}

export function formatWatchlistForPrompt(ctx: WatchlistContext): string {
  const lines = [
    ctx.userName ? `Account holder name: ${ctx.userName}` : null,
    ctx.userEmail ? `Account email: ${ctx.userEmail}` : null,
    ctx.companyName ? `Company: ${ctx.companyName}` : null,
    ctx.nameAliases.length ? `Name aliases: ${ctx.nameAliases.join(', ')}` : null,
    ctx.accountKeywords.length ? `Account keywords: ${ctx.accountKeywords.join(', ')}` : null,
    ctx.projectClientName ? `Project client: ${ctx.projectClientName}` : null,
    ctx.projectName ? `Project name: ${ctx.projectName}` : null,
    ctx.projectKeywords.length ? `Project keywords: ${ctx.projectKeywords.join(', ')}` : null,
    ctx.projectRole ? `My role on this project: ${ctx.projectRole}` : null,
  ].filter(Boolean);

  return lines.length ? lines.join('\n') : 'No watchlist configured — only flag items clearly assigned to the account holder.';
}

export async function loadWatchlistContext(
  supabase: ReturnType<typeof createServiceClient>,
  projectId: string,
  userId: string
): Promise<WatchlistContext> {
  const [{ data: project }, { data: profile }] = await Promise.all([
    supabase
      .from('projects')
      .select('client_name, project_name, watch_keywords, my_role')
      .eq('id', projectId)
      .single(),
    supabase
      .from('profiles')
      .select('full_name, company_name, name_aliases, watch_keywords')
      .eq('user_id', userId)
      .single(),
  ]);

  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  const email = userData?.user?.email ?? null;

  return {
    userName: profile?.full_name ?? null,
    userEmail: email,
    userEmailLocal: email?.split('@')[0] ?? null,
    companyName: profile?.company_name ?? null,
    nameAliases: parseKeywordArray(profile?.name_aliases),
    accountKeywords: parseKeywordArray(profile?.watch_keywords),
    projectClientName: project?.client_name ?? null,
    projectName: project?.project_name ?? null,
    projectKeywords: parseKeywordArray(project?.watch_keywords),
    projectRole: project?.my_role ?? null,
  };
}
