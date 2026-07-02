'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { hasActiveSubscription, planDisplayName } from '@/lib/billing/plans';
import { hasProAccess, isPremiumTestEmail } from '@/lib/billing/test-accounts';
import {
  fetchBillingStatus,
  openBillingPortal,
  pollBillingUntilPro,
} from '@/lib/billing/client-poll';
import { getSubscriptionAlert, subscriptionStatusLabel } from '@/lib/billing/subscription-ui';
import type { Profile } from '@/types/database';

const MOBILE_APP_SCHEME_URL = 'upperdeck://';

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export function BillingSettings({
  profile,
  userEmail,
  billingNotice,
}: {
  profile: Profile | null;
  userEmail?: string | null;
  billingNotice?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<'checkout' | 'portal' | null>(null);
  const [error, setError] = useState('');
  const [liveProfile, setLiveProfile] = useState(profile);
  const [paymentProcessing, setPaymentProcessing] = useState(billingNotice === 'success');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [onMobileDevice, setOnMobileDevice] = useState(false);

  useEffect(() => {
    setOnMobileDevice(isMobileDevice());
  }, []);

  // Signups that started in the mobile app finish checkout in the browser.
  // Once payment is confirmed, hand the user back to the app (Safari shows an
  // "Open in UpperDeck?" prompt; the button below is the fallback).
  useEffect(() => {
    if (!paymentConfirmed || !onMobileDevice) return;
    const timer = setTimeout(() => {
      window.location.href = MOBILE_APP_SCHEME_URL;
    }, 800);
    return () => clearTimeout(timer);
  }, [paymentConfirmed, onMobileDevice]);

  const isEnterprise = liveProfile?.account_type === 'enterprise';
  const isTestPremium = isPremiumTestEmail(userEmail);
  const isPro = hasProAccess({
    plan: liveProfile?.plan,
    subscriptionStatus: liveProfile?.subscription_status,
    accountType: liveProfile?.account_type,
    email: userEmail,
  });
  const hasStripeSubscription = hasActiveSubscription(
    liveProfile?.plan,
    liveProfile?.subscription_status
  );
  const subscriptionAlert = getSubscriptionAlert({
    subscriptionStatus: liveProfile?.subscription_status,
    isPro,
    hasStripeSubscription,
  });

  useEffect(() => {
    if (billingNotice !== 'success') return;

    let cancelled = false;
    setPaymentProcessing(true);

    pollBillingUntilPro(fetchBillingStatus, { maxAttempts: 15, intervalMs: 2000 })
      .then((confirmed) => {
        if (cancelled) return;
        setPaymentConfirmed(confirmed);
        setPaymentProcessing(false);
        if (confirmed) {
          fetchBillingStatus()
            .then((status) => {
              if (cancelled) return;
              setLiveProfile((prev) =>
                prev
                  ? {
                      ...prev,
                      plan: status.plan as Profile['plan'],
                      subscription_status: status.subscription_status as Profile['subscription_status'],
                    }
                  : prev
              );
              router.refresh();
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        if (!cancelled) setPaymentProcessing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [billingNotice, router]);

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
        if (data.usePortal) {
          setError(data.error ?? 'Use Manage billing to change your plan.');
        } else {
          setError(data.error ?? 'Checkout failed');
        }
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
    const result = await openBillingPortal();
    if (!result.ok) {
      setError(result.error);
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
      {subscriptionAlert && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            subscriptionAlert.tone === 'error'
              ? 'border-red-200 bg-red-50 text-red-900'
              : subscriptionAlert.tone === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-blue-200 bg-blue-50 text-blue-900'
          }`}
        >
          <p className="font-medium">{subscriptionAlert.title}</p>
          <p className="mt-1">{subscriptionAlert.body}</p>
          {subscriptionAlert.showManageBilling && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="mt-3"
              disabled={loading !== null}
              onClick={openPortal}
            >
              {loading === 'portal' ? 'Opening…' : 'Update payment method'}
            </Button>
          )}
        </div>
      )}

      {paymentProcessing && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Processing your payment… This usually takes a few seconds.
        </div>
      )}
      {!paymentProcessing && paymentConfirmed && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <p>Subscription updated. Thanks for upgrading to Pro.</p>
          {onMobileDevice && (
            <a
              href={MOBILE_APP_SCHEME_URL}
              className="mt-3 inline-flex items-center justify-center rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              Continue in the UpperDeck app
            </a>
          )}
        </div>
      )}
      {!paymentProcessing && billingNotice === 'success' && !paymentConfirmed && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>Payment received. If Pro access is not visible yet, refresh this page in a moment.</p>
          {onMobileDevice && (
            <a
              href={MOBILE_APP_SCHEME_URL}
              className="mt-3 inline-flex items-center justify-center rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
            >
              Continue in the UpperDeck app
            </a>
          )}
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
            {isTestPremium && !hasStripeSubscription
              ? 'Pro (test account)'
              : planDisplayName(liveProfile?.plan)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {isPro
              ? isTestPremium && !hasStripeSubscription
                ? 'Unlimited projects and Sunny chat'
                : hasStripeSubscription
                  ? `Status: ${subscriptionStatusLabel(liveProfile?.subscription_status)}`
                  : 'Pro access active'
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

      {error && (
        <div className="space-y-2">
          <p className="text-sm text-red-600">{error}</p>
          {error.includes('Manage billing') && (
            <Button type="button" size="sm" variant="secondary" onClick={openPortal}>
              Open billing portal
            </Button>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Payments are processed securely by Stripe.{' '}
        <Link href="/#pricing" className="underline text-gray-700 dark:text-gray-300">
          Compare plans
        </Link>
      </p>
    </div>
  );
}
