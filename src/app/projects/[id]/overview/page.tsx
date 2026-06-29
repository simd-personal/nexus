import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatNaturalSummary } from '@/lib/ai/generation-prompts';
import { Card, CardHeader } from '@/components/ui/Card';
import { CriticalItemsList } from '@/components/critical/CriticalItemCard';
import { ActionItemsList } from '@/components/actions/ActionItemCard';
import { StatusBadge } from '@/components/ui/Badge';
import { SubProjectsPanel } from '@/components/project/SubProjectsPanel';
import {
  getProject,
  getSubProjects,
  getParentProject,
  getProjectCriticalItems,
  getProjectActionItems,
  getProjectEntities,
  getProjectTimeline,
} from '@/lib/data/queries';
import { formatRelativeTime } from '@/lib/utils';
import { Sun, AlertTriangle, Users, MapPin, CheckSquare } from 'lucide-react';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';
import { DeleteProjectButton } from '@/components/project/DeleteProjectButton';
import { EntityMentionChips } from '@/components/project/EntityMentionChips';
import { ProjectRelevancePanel } from '@/components/project/ProjectRelevancePanel';

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const isProgram = !project.parent_project_id;
  const includeSubProjects = isProgram;

  const [subProjects, parentProject, criticalItems, actionItems, entities, timeline] = await Promise.all([
    isProgram ? getSubProjects(id) : Promise.resolve([]),
    getParentProject(project),
    getProjectCriticalItems(id, { includeSubProjects }),
    getProjectActionItems(id, { includeSubProjects }),
    getProjectEntities(id, { includeSubProjects }),
    getProjectTimeline(id, { includeSubProjects }),
  ]);

  const people = dedupeEntities(entities.filter((e) => e.type === 'person'));
  const facilities = dedupeEntities(entities.filter((e) => e.type === 'facility'));
  const conflicts = criticalItems.filter((c) => c.category === 'conflict');
  const openActions = actionItems.filter((a) => a.status === 'open');
  const recentEvents = timeline.slice(0, 5);

  const rolledUpStats = isProgram
    ? subProjects.reduce(
        (acc, sub) => ({
          files: acc.files + sub.file_count,
          critical: acc.critical + sub.critical_item_count,
          actions: acc.actions + sub.action_item_count,
        }),
        { files: 0, critical: 0, actions: 0 }
      )
    : null;

  return (
    <div className="space-y-6">
      {parentProject && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Workstream under{' '}
          <Link href={`/projects/${parentProject.id}/overview`} className="font-medium text-gray-900 underline dark:text-gray-100">
            {parentProject.project_name}
          </Link>
        </p>
      )}

      {isProgram && <SubProjectsPanel parentProject={project} subProjects={subProjects} />}

      <ProjectRelevancePanel
        projectId={project.id}
        watchKeywords={project.watch_keywords ?? []}
        myRole={project.my_role ?? null}
      />

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
            <GlanceItem
              icon={AlertTriangle}
              label="Critical items"
              value={criticalItems.filter((c) => c.status === 'open').length}
              hint={includeSubProjects && subProjects.length > 0 ? 'All workstreams' : undefined}
            />
            <GlanceItem icon={CheckSquare} label="Open actions" value={openActions.length} />
            <GlanceItem icon={Users} label="People mentioned" value={people.length} />
            <GlanceItem icon={MapPin} label="Facilities mentioned" value={facilities.length} />
            {rolledUpStats && subProjects.length > 0 && (
              <p className="border-t border-gray-100 pt-2 text-xs text-gray-500 dark:border-[var(--ud-cloud)] dark:text-gray-400">
                {rolledUpStats.files} files across {subProjects.length} workstream{subProjects.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </Card>
      </div>

      {conflicts.length > 0 && (
        <Card className="border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-950/20">
          <CardHeader title="Conflicts & Contradictions" />
          <CriticalItemsList items={conflicts} showProject={includeSubProjects && subProjects.length > 0} />
        </Card>
      )}

      {criticalItems.filter(c => c.status === 'open' && c.category !== 'conflict').length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Critical Items</h2>
          <CriticalItemsList
            items={criticalItems.filter(c => c.status === 'open' && c.category !== 'conflict')}
            showProject={includeSubProjects && subProjects.length > 0}
          />
        </div>
      )}

      {openActions.length > 0 && (
        <Card padding={false} className="overflow-hidden">
          <div className="px-6 pt-6">
            <CardHeader
              title="Open Action Items"
              description="Filtered to follow-ups relevant to you. Adjust keywords above to tune what Sunny surfaces."
            />
          </div>
          <ActionItemsList
            items={openActions}
            block
            embedded
            previewCount={2}
            totalCount={openActions.length}
          />
        </Card>
      )}

      {(people.length > 0 || facilities.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {people.length > 0 && (
            <Card>
              <CardHeader title="People Mentioned" description="Click a name to find where they're mentioned" />
              <EntityMentionChips
                projectId={project.id}
                entities={people}
                type="person"
                includeSubProjects={includeSubProjects}
              />
            </Card>
          )}
          {facilities.length > 0 && (
            <Card>
              <CardHeader title="Facilities / Locations" description="Click a place to find where it's mentioned" />
              <EntityMentionChips
                projectId={project.id}
                entities={facilities}
                type="facility"
                includeSubProjects={includeSubProjects}
              />
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

      <Card className="border-red-200 bg-red-50/20 dark:border-red-800 dark:bg-red-950/20">
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

type EntityRow = { id: string; name: string; normalized_name?: string | null };

function dedupeEntities<T extends EntityRow>(rows: T[]): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const row of rows) {
    const key = (row.normalized_name ?? row.name ?? '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
  }
  return unique;
}

function GlanceItem({ icon: Icon, label, value, hint }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <span>
          {label}
          {hint && <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">({hint})</span>}
        </span>
      </div>
      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}
