import { NextRequest, NextResponse } from 'next/server';
import { getDashboardPortfolioPreference, getOpenActionItems } from '@/lib/data/queries';
import { resolveDashboardPortfolioScope } from '@/lib/projects/portfolio';
import { requireRequestAuth } from '@/lib/supabase/request-auth';

export async function GET(request: NextRequest) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const params = request.nextUrl.searchParams;
  const limitRaw = params.get('limit');
  const limit = limitRaw ? Number(limitRaw) : undefined;
  const preference = await getDashboardPortfolioPreference(auth.supabase);
  const portfolioScope = resolveDashboardPortfolioScope(params.get('portfolio') ?? undefined, preference);

  const items = await getOpenActionItems(
    Number.isFinite(limit) && limit! > 0 ? limit : undefined,
    portfolioScope,
    auth.supabase
  );

  return NextResponse.json({ items, portfolio: portfolioScope });
}
