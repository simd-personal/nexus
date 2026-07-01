import { AppShellLayout } from '@/components/layout/AppShellLayout';
import { SunnyUpdatesList } from '@/components/updates/SunnyUpdateCard';
import { PortfolioScopeHeader } from '@/components/dashboard/PortfolioScopeHeader';
import { getPendingUploadBatches, getSunnyUpdates } from '@/lib/data/queries';
import { resolveActivePortfolioScope } from '@/lib/data/resolve-portfolio-scope';
import { SunnyAvatar } from '@/components/brand/SunnyAvatar';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function SunnyUpdatesPage({
  searchParams,
}: {
  searchParams: Promise<{ portfolio?: string }>;
}) {
  const params = await searchParams;
  const portfolioScope = await resolveActivePortfolioScope(params);
  const [updates, pendingBatches] = await Promise.all([
    getSunnyUpdates(undefined, portfolioScope),
    getPendingUploadBatches(portfolioScope),
  ]);

  return (
    <AppShellLayout>
      <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex items-center gap-3">
          <SunnyAvatar size="md" animate="idle" />
          <div>
            <h1 className="app-page-title text-2xl">{AI_EMPLOYEE_NAME} Updates</h1>
            <p className="text-sm text-[var(--app-text-muted)]">
              What changed, what matters, and what needs your attention
            </p>
          </div>
        </div>

        <PortfolioScopeHeader scope={portfolioScope} />

        <SunnyUpdatesList updates={updates} pendingBatches={pendingBatches} />
      </div>
    </AppShellLayout>
  );
}
