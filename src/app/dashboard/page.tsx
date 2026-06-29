import { AppShell } from '@/components/layout/AppShell';
import { GlobalSearchBar } from '@/components/ui/GlobalSearchBar';
import { SunnyCard } from '@/components/dashboard/SunnyCard';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { DashboardAttentionPanel } from '@/components/dashboard/DashboardAttentionPanel';
import { SunnyUpdatesList } from '@/components/updates/SunnyUpdateCard';
import { PendingInboundInbox } from '@/components/dashboard/PendingInboundInbox';
import {
  getProjectsWithStats,
  getDashboardStats,
  getCriticalItems,
  getOpenActionItems,
  getSunnyUpdates,
  getPendingInboundEmails,
} from '@/lib/data/queries';
import { TAGLINE } from '@/lib/constants';
import { needsOnboarding } from '@/lib/onboarding/status';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const projects = await getProjectsWithStats();
  if (needsOnboarding(projects)) {
    redirect('/getting-started');
  }

  const stats = await getDashboardStats();
  const showBoth = stats.criticalCount > 0 && stats.actionItemsCount > 0;
  const criticalLimit = showBoth ? 3 : 5;
  const actionFetchLimit =
    stats.actionItemsCount > 0 ? Math.min(stats.actionItemsCount, 5) : 0;

  const [criticalItems, actionItems, updates, pendingInboundEmails] = await Promise.all([
    stats.criticalCount > 0 ? getCriticalItems(criticalLimit) : Promise.resolve([]),
    actionFetchLimit > 0 ? getOpenActionItems(actionFetchLimit) : Promise.resolve([]),
    getSunnyUpdates(5),
    getPendingInboundEmails(),
  ]);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="app-page-title text-xl sm:text-2xl">Executive Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{TAGLINE}</p>
        </div>

        <GlobalSearchBar className="mb-6 sm:mb-8" />

        <PendingInboundInbox emails={pendingInboundEmails} projects={projects} />

        <div className="mb-6 grid grid-cols-1 gap-6 sm:mb-8 lg:grid-cols-3 lg:items-stretch">
          <div className="flex lg:col-span-1">
            <SunnyCard
              criticalCount={stats.criticalCount}
              newUpdatesCount={stats.newUpdatesCount}
              actionItemsCount={stats.actionItemsCount}
              conflictsCount={stats.conflictsCount}
            />
          </div>
          <div className="flex min-w-0 lg:col-span-2">
            <DashboardAttentionPanel
              criticalItems={criticalItems}
              actionItems={actionItems}
              criticalTotal={stats.criticalCount}
              actionTotal={stats.actionItemsCount}
            />
          </div>
        </div>

        <div className="mb-6 sm:mb-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Sunny Updates</h2>
            <Link href="/updates" className="shrink-0">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>
          <SunnyUpdatesList updates={updates} />
        </div>

        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Active Projects</h2>
            <Link href="/projects" className="shrink-0">
              <Button variant="secondary" size="sm" className="w-full sm:w-auto">Manage Projects</Button>
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 dark:bg-[var(--ud-mist)] dark:border-[var(--ud-cloud)]">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No projects yet. Create your first client project to get started.</p>
              <Link href="/projects">
                <Button>Create Project</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
