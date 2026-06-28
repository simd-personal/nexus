'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { hasActiveSubscription, planDisplayName } from '@/lib/billing/plans';
import { hasProAccess, isPremiumTestEmail } from '@/lib/billing/test-accounts';
import type { Profile } from '@/types/database';

export function BillingSettings({
  profile,
  userEmail,
  billingNotice,
}: {
  profile: Profile | null;
  userEmail?: string | null;
  billingNotice?: string | null;
}) {
  const [loading, setLoading] = useState<'checkout' | 'portal' | null>(null);
  const [error, setError] = useState('');

  const isEnterprise = profile?.account_type === 'enterprise';
  const isTestPremium = isPremiumTestEmail(userEmail);
  const isPro = hasProAccess({
    plan: profile?.plan,
    subscriptionStatus: profile?.subscription_status,
    accountType: profile?.account_type,
    email: userEmail,
  });
  const hasStripeSubscription = hasActiveSubscription(
    profile?.plan,
    profile?.subscription_status
  );

  async function openCheckout(plan: 'pro' | 'pro-annual') {
    setLoading('checkout');
    setError('');
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Checkout failed');
        setLoading(null);
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setError('Could not start checkout.');
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading('portal');
    setError('');
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Could not open billing portal');
        setLoading(null);
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setError('Could not open billing portal.');
      setLoading(null);
    }
  }

  if (isEnterprise) {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Your organization is on an enterprise plan. Billing is managed via your quote agreement.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {billingNotice === 'success' && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Subscription updated. Thanks for upgrading to Pro.
        </div>
      )}
      {billingNotice === 'canceled' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Checkout was canceled. You can upgrade anytime.
        </div>
      )}

      <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {isTestPremium && !hasStripeSubscription ? 'Pro (test account)' : planDisplayName(profile?.plan)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {isPro
              ? isTestPremium && !hasStripeSubscription
                ? 'Unlimited projects and Sunny chat'
                : `Status: ${profile?.subscription_status ?? 'active'}`
              : '1 project · 25 Sunny messages / month'}
          </p>
        </div>
        {isPro && hasStripeSubscription ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={loading !== null}
            onClick={openPortal}
          >
            {loading === 'portal' ? 'Opening…' : 'Manage billing'}
          </Button>
        ) : null}
      </div>

      {!isPro && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={loading !== null}
            onClick={() => openCheckout('pro')}
          >
            {loading === 'checkout' ? 'Starting…' : 'Upgrade · $39/mo'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={loading !== null}
            onClick={() => openCheckout('pro-annual')}
          >
            Annual · $348/yr
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Payments are processed securely by Stripe.{' '}
        <Link href="/#pricing" className="underline text-gray-700 dark:text-gray-300">
          Compare plans
        </Link>
      </p>
    </div>
  );
}
