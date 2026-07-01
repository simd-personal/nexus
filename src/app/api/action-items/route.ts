import { NextRequest, NextResponse } from 'next/server';
import {
  getActionItemsByStatus,
  getDashboardPortfolioPreference,
  getOpenActionItems,
} from '@/lib/data/queries';
import { resolveDashboardPortfolioScope } from '@/lib/projects/portfolio';
import { requireRequestAuth } from '@/lib/supabase/request-auth';
import type { ActionItemStatus } from '@/types/database';

const LIST_STATUSES = new Set<ActionItemStatus>(['open', 'in_progress', 'done', 'cancelled']);

export async function GET(request: NextRequest) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  try {
    const params = request.nextUrl.searchParams;
    const limitRaw = params.get('limit');
    const limit = limitRaw ? Number(limitRaw) : undefined;
    const statusParam = params.get('status') ?? 'open';
    const preference = await getDashboardPortfolioPreference(auth.supabase);
    const portfolioScope = resolveDashboardPortfolioScope(params.get('portfolio') ?? undefined, preference);

    if (!LIST_STATUSES.has(statusParam as ActionItemStatus)) {
      return NextResponse.json({ error: 'Valid status required' }, { status: 400 });
    }

    const resolvedLimit = Number.isFinite(limit) && limit! > 0 ? limit : undefined;

    const items =
      statusParam === 'open'
        ? await getOpenActionItems(resolvedLimit, portfolioScope, auth.supabase)
        : await getActionItemsByStatus(
            statusParam as Exclude<ActionItemStatus, 'open'>,
            resolvedLimit ?? 50,
            portfolioScope,
            auth.supabase
          );

    return NextResponse.json({ items, portfolio: portfolioScope, status: statusParam });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load action items';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
