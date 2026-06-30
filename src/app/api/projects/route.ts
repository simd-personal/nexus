import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { getProjectsWithStats, getDashboardPortfolioPreference } from '@/lib/data/queries';
import {
  createProjectForUser,
  createProjectInputFromFormData,
} from '@/lib/projects/create-project-core';
import { resolveDashboardPortfolioScope } from '@/lib/projects/portfolio';
import { requireRequestAuth } from '@/lib/supabase/request-auth';

export async function GET(request: NextRequest) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const portfolioParam = request.nextUrl.searchParams.get('portfolio');
  const preference = await getDashboardPortfolioPreference(auth.supabase);
  const portfolioScope = resolveDashboardPortfolioScope(portfolioParam ?? undefined, preference);

  const projects = await getProjectsWithStats({
    portfolio: portfolioScope,
    supabase: auth.supabase,
  });

  return NextResponse.json({ projects, portfolio: portfolioScope });
}

export async function POST(request: Request) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const formData = await request.formData();
  const input = createProjectInputFromFormData(formData);
  const result = await createProjectForUser(auth.supabase, auth.user, input);

  if (result.error) {
    return NextResponse.json(
      { error: result.error, upgradeRequired: result.upgradeRequired ?? false },
      { status: result.upgradeRequired ? 402 : 400 }
    );
  }

  revalidatePath('/dashboard');
  revalidatePath('/projects');
  revalidatePath('/getting-started');
  if (input.parentProjectId) revalidatePath(`/projects/${input.parentProjectId}/overview`);

  return NextResponse.json(result);
}
