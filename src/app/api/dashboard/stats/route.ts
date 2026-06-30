import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats, getDashboardPortfolioPreference } from '@/lib/data/queries';
import { resolveDashboardPortfolioScope } from '@/lib/projects/portfolio';
import { requireRequestAuth } from '@/lib/supabase/request-auth';

export async function GET(request: NextRequest) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const portfolioParam = request.nextUrl.searchParams.get('portfolio');
  const preference = await getDashboardPortfolioPreference(auth.supabase);
  const portfolioScope = resolveDashboardPortfolioScope(portfolioParam ?? undefined, preference);

  const stats = await getDashboardStats(portfolioScope, auth.supabase);
  return NextResponse.json({ stats, portfolio: portfolioScope });
}
