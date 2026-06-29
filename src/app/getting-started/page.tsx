import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { GettingStartedClient } from '@/components/onboarding/GettingStartedClient';
import { getProjectsWithStats, getProjectFiles } from '@/lib/data/queries';
import { resolveOnboardingStep } from '@/lib/onboarding/status';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function GettingStartedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const projects = await getProjectsWithStats();
  const primary = projects[0] ?? null;

  let recentFile: { id: string; status: string } | null = null;
  if (primary) {
    const files = await getProjectFiles(primary.id);
    const latest = files[0];
    if (latest) {
      recentFile = { id: latest.id, status: latest.status };
    }
  }

  const onboarding = resolveOnboardingStep({ projects, recentFile });

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8">
        <GettingStartedClient
          initialStep={onboarding.step}
          project={onboarding.project}
          activeFileId={onboarding.activeFileId}
          initialSummary={primary?.last_summary ?? null}
        />
      </div>
    </AppShell>
  );
}
