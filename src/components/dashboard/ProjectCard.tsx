import Link from 'next/link';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DeleteProjectButton } from '@/components/project/DeleteProjectButton';
import { formatRelativeTime } from '@/lib/utils';
import { projectPortfolioLabel } from '@/lib/projects/portfolio';
import type { ProjectWithStats } from '@/types/database';
import { FileText, Mail, Calendar, AlertTriangle, CheckSquare } from 'lucide-react';

export function ProjectCard({ project }: { project: ProjectWithStats }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{project.project_name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{project.client_name}</p>
          {(project.sub_project_count ?? 0) > 0 && (
            <p className="mt-1 text-xs text-violet-600 dark:text-violet-400">
              {project.sub_project_count} workstream{(project.sub_project_count ?? 0) !== 1 ? 's' : ''}
            </p>
          )}
          {project.portfolio === 'personal' && (
            <p className="mt-1 text-xs text-sky-600 dark:text-sky-400">
              {projectPortfolioLabel('personal')} portfolio
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <DeleteProjectButton
            iconOnly
            projectId={project.id}
            projectName={project.project_name}
            clientName={project.client_name}
          />
          <StatusBadge status={project.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Stat icon={FileText} label="Files" value={project.file_count} />
        <Stat icon={Calendar} label="Meetings" value={project.meeting_count} />
        <Stat icon={Mail} label="Emails" value={project.email_count} />
        <Stat icon={CheckSquare} label="Actions" value={project.action_item_count} />
      </div>

      {project.critical_item_count > 0 && (
        <div className="flex items-center gap-2 text-sm text-red-600 mb-3 dark:text-red-400">
          <AlertTriangle className="w-4 h-4" />
          {project.critical_item_count} critical finding{project.critical_item_count !== 1 ? 's' : ''}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400 mb-4 dark:text-gray-500">
        <span>Last activity: {project.last_activity_at ? formatRelativeTime(project.last_activity_at) : 'None'}</span>
        {project.last_sunny_update && (
          <span>Sunny: {formatRelativeTime(project.last_sunny_update)}</span>
        )}
      </div>

      <Link href={`/projects/${project.id}/overview`}>
        <Button variant="secondary" size="sm" className="w-full">
          Open Project
        </Button>
      </Link>
    </Card>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
      <Icon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
      <span>{value} {label}</span>
    </div>
  );
}
