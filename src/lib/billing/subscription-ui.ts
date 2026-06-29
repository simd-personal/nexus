export type SubscriptionAlertTone = 'info' | 'warning' | 'error';

export interface SubscriptionAlert {
  tone: SubscriptionAlertTone;
  title: string;
  body: string;
  showManageBilling: boolean;
}

/**
 * User-facing billing alerts for Stripe subscription states.
 */
export function getSubscriptionAlert(input: {
  subscriptionStatus: string | null | undefined;
  isPro: boolean;
  hasStripeSubscription: boolean;
}): SubscriptionAlert | null {
  const status = input.subscriptionStatus?.toLowerCase() ?? null;

  if (!input.hasStripeSubscription) return null;

  if (status === 'past_due') {
    return {
      tone: 'warning',
      title: 'Payment needs attention',
      body: 'Your last payment did not go through. Update your card in the billing portal to keep Pro access.',
      showManageBilling: true,
    };
  }

  if (status === 'unpaid') {
    return {
      tone: 'error',
      title: 'Pro subscription paused',
      body: 'Pro access may be limited until payment is resolved. Open billing to update your payment method.',
      showManageBilling: true,
    };
  }

  if (status === 'canceled' && !input.isPro) {
    return {
      tone: 'info',
      title: 'Subscription ended',
      body: 'Your Pro plan ended. You are on the free plan until you subscribe again.',
      showManageBilling: false,
    };
  }

  if (status === 'incomplete' || status === 'incomplete_expired') {
    return {
      tone: 'warning',
      title: 'Checkout incomplete',
      body: 'Finish checkout or start a new subscription from Settings when you are ready.',
      showManageBilling: false,
    };
  }

  return null;
}

export function subscriptionStatusLabel(status: string | null | undefined): string {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'Active';
    case 'trialing':
      return 'Trial';
    case 'past_due':
      return 'Past due';
    case 'unpaid':
      return 'Unpaid';
    case 'canceled':
      return 'Canceled';
    case 'incomplete':
      return 'Incomplete';
    case 'incomplete_expired':
      return 'Incomplete (expired)';
    default:
      return status ?? 'Unknown';
  }
}
