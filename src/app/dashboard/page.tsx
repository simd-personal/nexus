import { AppShellLayout } from '@/components/layout/AppShellLayout';
import { SunnyCard } from '@/components/dashboard/SunnyCard';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { DashboardAttentionPanel } from '@/components/dashboard/DashboardAttentionPanel';
import { DashboardUpdatesPanel } from '@/components/dashboard/DashboardUpdatesPanel';
import { PendingInboundInbox } from '@/components/dashboard/PendingInboundInbox';
import { PortfolioScopeHeader } from '@/components/dashboard/PortfolioScopeHeader';
import {
  getProjectsWithStats,
  getDashboardStats,
  getCriticalItems,
  getOpenActionItems,
  getDashboardUpdatesFeed,
  getPendingInboundEmails,
} from '@/lib/data/queries';
import { resolveActivePortfolioScope } from '@/lib/data/resolve-portfolio-scope';
import { dashboardScopeLabel } from '@/lib/projects/portfolio';
import { TAGLINE } from '@/lib/constants';
import { needsOnboarding } from '@/lib/onboarding/status';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ portfolio?: string }>;
}) {
  const params = await searchParams;
  const portfolioScope = await resolveActivePortfolioScope(params);

  const allProjects = await getProjectsWithStats();
  if (needsOnboarding(allProjects)) {
    redirect('/getting-started');
  }

  const projects = await getProjectsWithStats({ portfolio: portfolioScope });
  const stats = await getDashboardStats(portfolioScope);
  const showBoth = stats.criticalCount > 0 && stats.actionItemsCount > 0;
  const criticalLimit = showBoth ? 3 : 5;
  const actionFetchLimit =
    stats.actionItemsCount > 0 ? Math.min(stats.actionItemsCount, 5) : 0;

  const [criticalItems, actionItems, updatesFeed, pendingInboundEmails] = await Promise.all([
    stats.criticalCount > 0 ? getCriticalItems(criticalLimit, portfolioScope) : Promise.resolve([]),
    actionFetchLimit > 0 ? getOpenActionItems(actionFetchLimit, portfolioScope) : Promise.resolve([]),
    getDashboardUpdatesFeed(5, portfolioScope),
    getPendingInboundEmails(),
  ]);

  return (
    <AppShellLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="app-page-title text-xl sm:text-2xl">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{TAGLINE}</p>
        </div>

        <PortfolioScopeHeader
          scope={portfolioScope}
          description={
            portfolioScope === 'all'
              ? 'Showing all projects.'
              : `Showing ${dashboardScopeLabel(portfolioScope).toLowerCase()} projects only.`
          }
        />

        <PendingInboundInbox emails={pendingInboundEmails} projects={allProjects} />

        <div key={portfolioScope} className="contents">
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

        <DashboardUpdatesPanel portfolioScope={portfolioScope} initialFeed={updatesFeed} />

        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Active Projects</h2>
            <Link href="/projects" className="shrink-0">
              <Button variant="secondary" size="sm" className="w-full sm:w-auto">Manage Projects</Button>
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white py-12 text-center dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)]">
              <p className="mb-4 text-gray-500 dark:text-gray-400">
                No {portfolioScope === 'all' ? '' : `${dashboardScopeLabel(portfolioScope).toLowerCase()} `}
                projects in this view.
              </p>
              <Link href="/projects">
                <Button>Create Project</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </AppShellLayout>
  );
}
