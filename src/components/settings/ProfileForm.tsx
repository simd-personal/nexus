'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { RelevanceProfileFields } from '@/components/settings/RelevanceProfileFields';
import { updateProfile, type SettingsFormState } from '@/lib/actions/projects';

const INITIAL_STATE: SettingsFormState = { status: 'idle', message: '' };

interface ProfileFormProps {
  email: string;
  fullName: string;
  accountTypeLabel: string;
  companyName: string | null;
  nameAliases: string[];
  watchKeywords: string[];
}

export function ProfileForm({
  email,
  fullName,
  accountTypeLabel,
  companyName,
  nameAliases,
  watchKeywords,
}: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfile, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
        <input
          name="full_name"
          defaultValue={fullName}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-100 dark:focus:ring-gray-500"
        />
      </div>
      <RelevanceProfileFields
        companyName={companyName}
        nameAliases={nameAliases}
        watchKeywords={watchKeywords}
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account type</label>
        <input
          type="text"
          value={accountTypeLabel}
          disabled
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-400"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" loading={pending}>
          {pending ? 'Saving…' : 'Save Changes'}
        </Button>
        {state.status !== 'idle' && (
          <p
            aria-live="polite"
            className={`text-sm ${state.status === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
