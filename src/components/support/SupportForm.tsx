'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { submitSupportRequest, type SupportFormState } from '@/lib/actions/support';
import type { SupportRequestCategory } from '@/lib/email/templates';

const INITIAL_STATE: SupportFormState = { status: 'idle', message: '' };

const CATEGORY_OPTIONS: Array<{ value: SupportRequestCategory; label: string; hint: string }> = [
  {
    value: 'feedback',
    label: 'Feedback',
    hint: 'Tell us what is working well or what could be smoother.',
  },
  {
    value: 'idea',
    label: 'Product idea',
    hint: 'Suggest a feature or improvement you would like to see.',
  },
  {
    value: 'bug',
    label: 'Bug report',
    hint: 'Something broken? We usually fix these within 24–48 hours.',
  },
];

interface SupportFormProps {
  email: string;
  fullName: string;
}

export function SupportForm({ email, fullName }: SupportFormProps) {
  const [state, formAction, pending] = useActionState(submitSupportRequest, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-5">
      <input
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input
            type="text"
            value={fullName || '—'}
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-500 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-500 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-400"
          />
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          What would you like to share?
        </legend>
        <div className="space-y-2">
          {CATEGORY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer gap-3 rounded-lg border border-gray-200 px-4 py-3 transition-colors has-[:checked]:border-[var(--brand-accent)] has-[:checked]:bg-[rgba(37,99,235,0.04)] dark:border-[var(--ud-cloud)] dark:has-[:checked]:bg-[rgba(37,99,235,0.12)]"
            >
              <input
                type="radio"
                name="category"
                value={option.value}
                defaultChecked={option.value === 'feedback'}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand-accent)]"
                required
              />
              <span>
                <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">{option.label}</span>
                <span className="mt-0.5 block text-sm text-gray-500 dark:text-gray-400">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="support-message" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Message
        </label>
        <textarea
          id="support-message"
          name="message"
          rows={6}
          required
          placeholder="Share as much detail as you can — for bugs, include what you expected and what happened instead."
          className="w-full resize-y rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-100 dark:focus:ring-gray-500"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" loading={pending}>
          {pending ? 'Sending…' : 'Send to support'}
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
