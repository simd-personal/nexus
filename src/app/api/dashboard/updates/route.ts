import { NextRequest, NextResponse } from 'next/server';
import { getDashboardUpdatesFeed, getDashboardPortfolioPreference } from '@/lib/data/queries';
import { resolveDashboardPortfolioScope } from '@/lib/projects/portfolio';
import { requireRequestAuth } from '@/lib/supabase/request-auth';

export async function GET(request: NextRequest) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const portfolioParam = request.nextUrl.searchParams.get('portfolio');
  const preference = await getDashboardPortfolioPreference(auth.supabase);
  const portfolioScope = resolveDashboardPortfolioScope(portfolioParam ?? undefined, preference);
  const limitParam = Number(request.nextUrl.searchParams.get('limit') ?? '5');
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 20) : 5;

  const feed = await getDashboardUpdatesFeed(limit, portfolioScope, auth.supabase);

  return NextResponse.json(feed, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
