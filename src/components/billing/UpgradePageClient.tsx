'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { B2C_PRICING } from '@/lib/marketing/pricing';

const VALID_PLANS = new Set(['pro', 'pro-annual']);

export function UpgradePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') ?? 'pro';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const tier = B2C_PRICING.find((item) => item.id === plan || (plan === 'pro-annual' && item.id === 'pro-annual'));

  useEffect(() => {
    if (!VALID_PLANS.has(plan)) {
      setError('Choose Pro monthly or Pro annual from pricing.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function startCheckout() {
      try {
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan }),
        });
        const data = await response.json();

        if (!response.ok) {
          if (!cancelled) {
            setError(data.error ?? 'Could not start checkout.');
            setLoading(false);
          }
          return;
        }

        if (data.url) {
          window.location.href = data.url;
          return;
        }

        if (!cancelled) {
          setError('Checkout URL missing. Try again from Settings.');
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError('Something went wrong. Please try again.');
          setLoading(false);
        }
      }
    }

    startCheckout();
    return () => {
      cancelled = true;
    };
  }, [plan]);

  return (
    <AppShell>
      <div className="mx-auto max-w-lg p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-gray-900">Upgrade to Pro</h1>
        <p className="mt-2 text-sm text-gray-600">
          {loading
            ? `Redirecting you to secure checkout for ${tier?.name ?? 'Pro'}…`
            : 'Checkout could not be started.'}
        </p>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <Button type="button" variant="secondary" onClick={() => router.push('/settings')}>
            Back to settings
          </Button>
          {!loading && (
            <Button type="button" onClick={() => window.location.reload()}>
              Try again
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
