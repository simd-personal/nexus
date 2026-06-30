import { NextRequest, NextResponse } from 'next/server';
import { getDashboardUpdatesFeed } from '@/lib/data/queries';
import { resolveDashboardPortfolioScope } from '@/lib/projects/portfolio';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const portfolioParam = request.nextUrl.searchParams.get('portfolio');
  const portfolioScope = resolveDashboardPortfolioScope(portfolioParam, null);
  const limitParam = Number(request.nextUrl.searchParams.get('limit') ?? '5');
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 20) : 5;

  const feed = await getDashboardUpdatesFeed(limit, portfolioScope);

  return NextResponse.json(feed, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
