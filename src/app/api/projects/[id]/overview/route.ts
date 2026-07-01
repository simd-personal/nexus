import { NextRequest, NextResponse } from 'next/server';
import {
  getProject,
  getProjectCriticalItems,
  getProjectNavVisibility,
  getProjectsWithStats,
} from '@/lib/data/queries';
import { requireRequestAuth } from '@/lib/supabase/request-auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRequestAuth(request);
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const project = await getProject(id, auth.supabase);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const includeSubProjects = !project.parent_project_id;
  const [criticalItems, projectsWithStats, navVisibility] = await Promise.all([
    getProjectCriticalItems(id, { includeSubProjects, supabase: auth.supabase }),
    getProjectsWithStats({ supabase: auth.supabase }),
    getProjectNavVisibility(id, { supabase: auth.supabase }),
  ]);

  const statsProject =
    projectsWithStats.find((entry) => entry.id === id) ??
    projectsWithStats
      .flatMap((entry) => entry.sub_projects ?? [])
      .find((entry) => entry.id === id);

  return NextResponse.json({
    project,
    stats: statsProject
      ? {
          file_count: statsProject.file_count,
          critical_item_count: statsProject.critical_item_count,
          action_item_count: statsProject.action_item_count,
        }
      : null,
    critical_items: criticalItems.slice(0, 5),
    nav: {
      show_timeline: navVisibility.showTimeline,
      show_critical_items: navVisibility.showCriticalItems,
    },
  });
}
