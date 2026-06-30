import Link from 'next/link';
import { AppShellLayout } from '@/components/layout/AppShellLayout';
import { getProfile } from '@/lib/data/queries';
import { updateOrganizationSettings } from '@/lib/actions/organizations';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { EmailForwardSettings } from '@/components/settings/EmailForwardSettings';
import { OrganizationAdminPanel } from '@/components/settings/OrganizationAdminPanel';
import { BillingSettings } from '@/components/settings/BillingSettings';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { ProfileForm } from '@/components/settings/ProfileForm';
import { DashboardPortfolioSettingsCard } from '@/components/settings/DashboardPortfolioSettings';
import { ProductTourSettingsCard } from '@/components/settings/ProductTourSettings';
import { getOrganizationAdminContext } from '@/lib/actions/organizations';
import { getDashboardPortfolioPreference } from '@/lib/data/queries';
import { planDisplayName } from '@/lib/billing/plans';
import { hasProAccess } from '@/lib/billing/test-accounts';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const data = await getProfile();
  const dashboardScope = await getDashboardPortfolioPreference();
  const orgContext = await getOrganizationAdminContext();
  const params = await searchParams;
  const isEnterprise = orgContext.profile?.account_type === 'enterprise';
  const isPro = hasProAccess({
    plan: data?.profile?.plan,
    subscriptionStatus: data?.profile?.subscription_status,
    accountType: data?.profile?.account_type,
    email: data?.user.email,
  });
  const isOrgAdmin =
    orgContext.membership?.role === 'owner' || orgContext.membership?.role === 'admin';

  return (
    <AppShellLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="app-page-title text-2xl">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account and security</p>
        </div>

        <Card>
          <CardHeader
            title="Appearance"
            description="Display preferences saved on this device"
          />
          <AppearanceSettings />
        </Card>

        <Card className="mt-6">
          <CardHeader
            title="Email forwarding"
            description="Forward from Outlook to track emails and attachments automatically"
          />
          <EmailForwardSettings />
        </Card>

        <DashboardPortfolioSettingsCard currentScope={dashboardScope} />

        <ProductTourSettingsCard />

        <Card className="mt-6">
          <CardHeader title="Profile" />
          <ProfileForm
            email={data?.user.email ?? ''}
            fullName={data?.profile?.full_name ?? ''}
            accountTypeLabel={
              isEnterprise
                ? 'Organization (enterprise)'
                : isPro
                  ? planDisplayName(data?.profile?.plan)
                  : 'Personal (free)'
            }
            companyName={data?.profile?.company_name ?? null}
            nameAliases={data?.profile?.name_aliases ?? []}
            watchKeywords={data?.profile?.watch_keywords ?? []}
          />
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
              <form action={updateOrganizationSettings} className="mt-6 border-t border-gray-100 pt-4 dark:border-[var(--ud-cloud)]">
                <input type="hidden" name="organization_id" value={orgContext.organization.id} />
                <label className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
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
            userEmail={data?.user.email ?? null}
            billingNotice={params.billing ?? null}
          />
        </Card>

        <Card className="mt-6">
          <CardHeader
            title="Sign out"
            description="End your session on this device"
          />
          <SignOutButton variant="settings" />
        </Card>

        <Card className="mt-6">
          <CardHeader title="Security & Privacy" description="Current safeguards" />
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li>Free personal accounts include email confirmation and password reset</li>
            <li>Organization tenants are sold via quote for admin access, audit trail, and PHI options</li>
            <li>Healthcare tenants can enable PHI redaction during file processing</li>
            <li>API keys are server side only and never exposed to the browser</li>
            <li>Row Level Security limits data access to authorized users</li>
            <li className="text-amber-700 dark:text-amber-400">
              HIPAA compliance for production healthcare use still requires legal review, BAAs, and audit controls beyond this MVP layer.
            </li>
          </ul>
        </Card>

        {!isEnterprise && (
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Need a shared tenant with admin controls?{' '}
            <Link href="/request-quote" className="text-gray-900 underline dark:text-gray-100">
              Request a quote
            </Link>
          </p>
        )}
      </div>
    </AppShellLayout>
  );
}
