import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { getProfile } from '@/lib/data/queries';
import { updateProfile } from '@/lib/actions/projects';
import { updateOrganizationSettings } from '@/lib/actions/organizations';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { OrganizationAdminPanel } from '@/components/settings/OrganizationAdminPanel';
import { BillingSettings } from '@/components/settings/BillingSettings';
import { getOrganizationAdminContext } from '@/lib/actions/organizations';
import { hasActiveSubscription, planDisplayName } from '@/lib/billing/plans';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const data = await getProfile();
  const orgContext = await getOrganizationAdminContext();
  const params = await searchParams;
  const isEnterprise = orgContext.profile?.account_type === 'enterprise';
  const isPro = hasActiveSubscription(data?.profile?.plan, data?.profile?.subscription_status);
  const isOrgAdmin =
    orgContext.membership?.role === 'owner' || orgContext.membership?.role === 'admin';

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account and security</p>
        </div>

        <Card>
          <CardHeader title="Profile" />
          <form action={updateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={data?.user.email ?? ''}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                name="full_name"
                defaultValue={data?.profile?.full_name ?? ''}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account type</label>
              <input
                type="text"
                value={
                  isEnterprise
                    ? 'Organization (enterprise)'
                    : isPro
                      ? planDisplayName(data?.profile?.plan)
                      : 'Personal (free)'
                }
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
              />
            </div>
            <Button type="submit" size="sm">Save Changes</Button>
          </form>
        </Card>

        <Card className="mt-6">
          <CardHeader
            title="Password & recovery"
            description="Update your password here. Use Forgot password on the sign-in screen if you lose access."
          />
          <SecuritySettings />
        </Card>

        {isEnterprise && orgContext.organization && orgContext.membership && (
          <Card className="mt-6">
            <CardHeader
              title="Organization"
              description="Admin controls for team access and healthcare safeguards"
            />
            <OrganizationAdminPanel
              organization={orgContext.organization}
              membership={orgContext.membership}
              members={orgContext.members}
              requests={orgContext.requests}
            />

            {isOrgAdmin && (
              <form action={updateOrganizationSettings} className="mt-6 border-t border-gray-100 pt-4">
                <input type="hidden" name="organization_id" value={orgContext.organization.id} />
                <label className="flex items-start gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="phi_protection_enabled"
                    defaultChecked={orgContext.organization.phi_protection_enabled}
                    className="mt-1"
                  />
                  <span>
                    Enable PHI redaction on uploaded files (recommended for healthcare tenants).
                    Detected identifiers are replaced before indexing and AI analysis.
                  </span>
                </label>
                <Button type="submit" size="sm" className="mt-4">
                  Save organization settings
                </Button>
              </form>
            )}
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader
            title="Billing"
            description="Manage your UpperDeck subscription"
          />
          <BillingSettings
            profile={data?.profile ?? null}
            billingNotice={params.billing ?? null}
          />
        </Card>

        <Card className="mt-6">
          <CardHeader title="Security & Privacy" description="Current safeguards" />
          <ul className="text-sm text-gray-600 space-y-2">
            <li>Free personal accounts include email confirmation and password reset</li>
            <li>Organization tenants are sold via quote for admin access, audit trail, and PHI options</li>
            <li>Healthcare tenants can enable PHI redaction during file processing</li>
            <li>API keys are server side only and never exposed to the browser</li>
            <li>Row Level Security limits data access to authorized users</li>
            <li className="text-amber-700">
              HIPAA compliance for production healthcare use still requires legal review, BAAs, and audit controls beyond this MVP layer.
            </li>
          </ul>
        </Card>

        {!isEnterprise && (
          <p className="mt-6 text-sm text-gray-500">
            Need a shared tenant with admin controls?{' '}
            <Link href="/request-quote" className="text-gray-900 underline">
              Request a quote
            </Link>
          </p>
        )}
      </div>
    </AppShell>
  );
}
