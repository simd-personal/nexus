import { AppShellLayout } from '@/components/layout/AppShellLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { SupportForm } from '@/components/support/SupportForm';
import { SUPPORT_EMAIL } from '@/lib/constants';
import { getProfile } from '@/lib/data/queries';

export const dynamic = 'force-dynamic';

export default async function SupportPage() {
  const data = await getProfile();
  const email = data?.user.email ?? '';
  const fullName = data?.profile?.full_name ?? '';

  return (
    <AppShellLayout>
      <div className="max-w-2xl p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="app-page-title text-2xl">Support</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Share feedback, ideas, or bug reports — we read every message and use it to make UpperDeck better.
          </p>
        </div>

        <Card>
          <CardHeader
            title="Contact our team"
            description={`Messages go to ${SUPPORT_EMAIL}. For bugs, we usually ship a fix within 24–48 hours.`}
          />
          <SupportForm email={email} fullName={fullName} />
        </Card>
      </div>
    </AppShellLayout>
  );
}
