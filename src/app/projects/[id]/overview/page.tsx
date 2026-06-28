import { notFound } from 'next/navigation';
import { formatNaturalSummary } from '@/lib/ai/generation-prompts';
import { Card, CardHeader } from '@/components/ui/Card';
import { CriticalItemsList } from '@/components/critical/CriticalItemCard';
import { StatusBadge } from '@/components/ui/Badge';
import {
  getProject,
  getProjectCriticalItems,
  getProjectActionItems,
  getProjectEntities,
  getProjectTimeline,
} from '@/lib/data/queries';
import { formatRelativeTime } from '@/lib/utils';
import { Sun, AlertTriangle, Users, MapPin, CheckSquare } from 'lucide-react';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';
import { DeleteProjectButton } from '@/components/project/DeleteProjectButton';

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, criticalItems, actionItems, entities, timeline] = await Promise.all([
    getProject(id),
    getProjectCriticalItems(id),
    getProjectActionItems(id),
    getProjectEntities(id),
    getProjectTimeline(id),
  ]);

  if (!project) notFound();

  const people = entities.filter((e) => e.type === 'person');
  const facilities = entities.filter((e) => e.type === 'facility');
  const conflicts = criticalItems.filter((c) => c.category === 'conflict');
  const openActions = actionItems.filter((a) => a.status === 'open');
  const recentEvents = timeline.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title={`${AI_EMPLOYEE_NAME}'s Summary`} />
          {project.last_summary ? (
            <p className="text-sm text-gray-700 dark:text-gray-300">{formatNaturalSummary(project.last_summary)}</p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No summary yet. Upload project materials for {AI_EMPLOYEE_NAME} to analyze.
            </p>
          )}
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-400 dark:text-gray-500">
            <span>Status: <StatusBadge status={project.status} /></span>
            {project.last_activity_at && (
              <span>Last activity: {formatRelativeTime(project.last_activity_at)}</span>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="At a Glance" />
          <div className="space-y-3">
            <GlanceItem icon={AlertTriangle} label="Critical items" value={criticalItems.filter(c => c.status === 'open').length} />
            <GlanceItem icon={CheckSquare} label="Open actions" value={openActions.length} />
            <GlanceItem icon={Users} label="People mentioned" value={people.length} />
            <GlanceItem icon={MapPin} label="Facilities mentioned" value={facilities.length} />
          </div>
        </Card>
      </div>

      {conflicts.length > 0 && (
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader title="Conflicts & Contradictions" />
          <CriticalItemsList items={conflicts} />
        </Card>
      )}

      {criticalItems.filter(c => c.status === 'open' && c.category !== 'conflict').length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Critical Items</h2>
          <CriticalItemsList items={criticalItems.filter(c => c.status === 'open' && c.category !== 'conflict')} />
        </div>
      )}

      {openActions.length > 0 && (
        <Card>
          <CardHeader title="Open Action Items" />
          <div className="space-y-3">
            {openActions.map((item) => (
              <div key={item.id} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
                  {item.owner && <p className="text-xs text-gray-500 dark:text-gray-400">Owner: {item.owner}</p>}
                </div>
                {item.due_date && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">Due: {item.due_date}</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {(people.length > 0 || facilities.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {people.length > 0 && (
            <Card>
              <CardHeader title="People Mentioned" />
              <div className="flex flex-wrap gap-2">
                {people.map((p) => (
                  <span key={p.id} className="px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-700 dark:text-gray-300">
                    {p.name}
                  </span>
                ))}
              </div>
            </Card>
          )}
          {facilities.length > 0 && (
            <Card>
              <CardHeader title="Facilities / Locations" />
              <div className="flex flex-wrap gap-2">
                {facilities.map((f) => (
                  <span key={f.id} className="px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-700 dark:text-gray-300">
                    {f.name}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {recentEvents.length > 0 && (
        <Card>
          <CardHeader title="Recent Activity" />
          <div className="space-y-2">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-3 text-sm">
                <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-gray-900 dark:text-gray-100">{event.title}</span>
                <span className="text-gray-400 dark:text-gray-500 text-xs ml-auto">{formatRelativeTime(event.created_at)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="border-red-200 bg-red-50/20">
        <CardHeader
          title="Danger zone"
          description="Permanently delete this project, all files, chats, and indexed content."
        />
        <DeleteProjectButton
          projectId={id}
          projectName={project.project_name}
          clientName={project.client_name}
        />
      </Card>
    </div>
  );
}

function GlanceItem({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        {label}
      </div>
      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}
