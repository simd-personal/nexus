import { NextRequest, NextResponse } from 'next/server';
import { generatePageExecutiveOnePager } from '@/lib/ai/page-generation';
import { getProjectContext } from '@/lib/generate/context';
import { getProjectsWithStats } from '@/lib/data/queries';
import {
  listDashboardProjectOptions,
  resolveExecutiveOnePagerProjectIds,
} from '@/lib/dashboard/executive-one-pager';
import {
  parseDashboardPortfolioScope,
  type DashboardPortfolioScope,
} from '@/lib/projects/portfolio';
import { requireRequestAuth } from '@/lib/supabase/request-auth';

export type ExecutiveOnePagerResult = {
  project_id: string;
  client_name: string;
  project_name: string;
  title: string;
  content: string;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRequestAuth(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const selection = typeof body.project_id === 'string' ? body.project_id : 'all';
    const portfolio = parseDashboardPortfolioScope(body.portfolio) ?? ('work' as DashboardPortfolioScope);
    const instructions = typeof body.instructions === 'string' ? body.instructions : undefined;

    const projects = await getProjectsWithStats({ portfolio, supabase: auth.supabase });
    const projectIds = resolveExecutiveOnePagerProjectIds(projects, selection === 'all' ? 'all' : selection);

    if (projectIds.length === 0) {
      return NextResponse.json({ error: 'No projects in this view' }, { status: 400 });
    }

    const allowedIds = new Set(listDashboardProjectOptions(projects).map((option) => option.id));
    const targets = projectIds.filter((id) => allowedIds.has(id));

    if (targets.length === 0) {
      return NextResponse.json({ error: 'Project not found in this view' }, { status: 404 });
    }

    const results: ExecutiveOnePagerResult[] = [];

    for (const projectId of targets) {
      const { project, context } = await getProjectContext(projectId, auth.supabase);
      if (!project) continue;

      const content = await generatePageExecutiveOnePager(
        project.project_name,
        project.client_name,
        context,
        instructions
      );
      const title = `Executive One-Pager · ${project.client_name}`;

      await auth.supabase.from('generated_documents').insert({
        project_id: projectId,
        type: 'brief',
        title,
        content,
        citations: [],
        metadata: {
          doc_kind: 'executive_one_pager',
          source: 'dashboard',
          portfolio,
          ...(instructions ? { instructions } : {}),
        },
      });

      results.push({
        project_id: projectId,
        client_name: project.client_name,
        project_name: project.project_name,
        title,
        content,
      });
    }

    if (results.length === 0) {
      return NextResponse.json({ error: 'Unable to generate one-pagers' }, { status: 500 });
    }

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error(
      'Executive one-pager error:',
      error instanceof Error ? error.message : 'Unknown'
    );
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
