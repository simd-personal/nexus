import { AppShell } from '@/components/layout/AppShell';
import { getProfile } from '@/lib/data/queries';
import { updateProfile } from '@/lib/actions/projects';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function SettingsPage() {
  const data = await getProfile();

  return (
    <AppShell>
      <div className="p-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account</p>
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
            <Button type="submit" size="sm">Save Changes</Button>
          </form>
        </Card>

        <Card className="mt-6">
          <CardHeader title="Security & Privacy" description="MVP safeguards in place" />
          <ul className="text-sm text-gray-600 space-y-2">
            <li>API keys are server-side only — never exposed to the browser</li>
            <li>Row Level Security (RLS) ensures users only access their own projects</li>
            <li>Raw files stored securely in Supabase Storage with access controls</li>
            <li>Source citations are internal only — no public sharing in MVP</li>
            <li className="text-amber-700">
              Note: PHI, PII, and HIPAA safeguards would need to be expanded before production use
            </li>
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
