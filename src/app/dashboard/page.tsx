import { AppShell } from '@/components/layout/AppShell';
import { GlobalSearchBar } from '@/components/ui/GlobalSearchBar';
import { SunnyCard } from '@/components/dashboard/SunnyCard';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { CriticalItemsList } from '@/components/critical/CriticalItemCard';
import { SunnyUpdatesList } from '@/components/updates/SunnyUpdateCard';
import {
  getProjectsWithStats,
  getDashboardStats,
  getCriticalItems,
  getSunnyUpdates,
} from '@/lib/data/queries';
import { TAGLINE } from '@/lib/constants';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default async function DashboardPage() {
  const [projects, stats, criticalItems, updates] = await Promise.all([
    getProjectsWithStats(),
    getDashboardStats(),
    getCriticalItems(5),
    getSunnyUpdates(5),
  ]);

  return (
    <AppShell>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">{TAGLINE}</p>
        </div>

        <GlobalSearchBar className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <SunnyCard
              criticalCount={stats.criticalCount}
              newUpdatesCount={stats.newUpdatesCount}
              actionItemsCount={stats.actionItemsCount}
              conflictsCount={stats.conflictsCount}
            />
          </div>
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Critical Items</h2>
              <Link href="/critical-items">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </div>
            <CriticalItemsList items={criticalItems} showProject />
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Sunny Updates</h2>
            <Link href="/updates">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>
          <SunnyUpdatesList updates={updates} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Projects</h2>
            <Link href="/projects">
              <Button variant="secondary" size="sm">Manage Projects</Button>
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500 mb-4">No projects yet. Create your first client project to get started.</p>
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
