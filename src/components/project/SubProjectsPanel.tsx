import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { CreateProjectForm } from '@/components/projects/CreateProjectForm';
import type { ProjectWithStats } from '@/types/database';
import { FolderTree } from 'lucide-react';

export function SubProjectsPanel({
  parentProject,
  subProjects,
}: {
  parentProject: Pick<ProjectWithStats, 'id' | 'client_name' | 'project_name'>;
  subProjects: ProjectWithStats[];
}) {
  return (
    <Card>
      <CardHeader
        title="Workstreams"
        description="Parallel sub-projects under this program — each has its own files, inbox, and Sunny context"
      />
      {subProjects.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No workstreams yet. Add one for a parallel track (e.g. site rollout vs. HQ planning).
        </p>
      ) : (
        <div className="space-y-3">
          {subProjects.map((sub) => (
            <Link
              key={sub.id}
              href={`/projects/${sub.id}/overview`}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50 dark:border-[var(--ud-cloud)] dark:hover:bg-[var(--ud-stone)]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FolderTree className="h-5 w-5 shrink-0 text-violet-500" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{sub.project_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {sub.file_count} files · {sub.critical_item_count} critical · {sub.action_item_count} actions
                  </p>
                </div>
              </div>
              <StatusBadge status={sub.status} />
            </Link>
          ))}
        </div>
      )}
      <div className="mt-4">
        <CreateProjectForm
          variant="compact"
          parentProject={{
            id: parentProject.id,
            client_name: parentProject.client_name,
            project_name: parentProject.project_name,
          }}
        />
      </div>
    </Card>
  );
}
