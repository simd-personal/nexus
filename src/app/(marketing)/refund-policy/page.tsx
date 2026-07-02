import Link from 'next/link';
import { MarketingPageLayout } from '@/components/marketing/MarketingPageLayout';
import {
  APP_DOMAIN,
  APP_NAME,
  LEGAL_ENTITY_DESCRIPTION,
  PARENT_COMPANY_LEGAL_NAME,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
} from '@/lib/constants';
import { createMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = createMarketingMetadata({
  title: 'Return & refund policy',
  description:
    `UpperDeck return and refund policy, operated by ${PARENT_COMPANY_LEGAL_NAME}. How cancellations, refunds, and billing disputes are handled for our subscription plans.`,
  path: '/refund-policy',
});

export default function RefundPolicyPage() {
  return (
    <MarketingPageLayout
      eyebrow="Legal"
      title="Return & refund policy"
      description={`How cancellations and refunds work for ${APP_NAME} (${APP_DOMAIN}), operated by ${PARENT_COMPANY_LEGAL_NAME}.`}
    >
      <section className="marketing-section bg-white">
        <div className="marketing-container max-w-3xl marketing-prose">
          <p className="text-sm marketing-text-muted">Last updated: July 1, 2026</p>

          <h2>Who we are</h2>
          <p>{LEGAL_ENTITY_DESCRIPTION}</p>

          <h2>Digital service — no physical returns</h2>
          <p>
            {APP_NAME} is a software-as-a-service (SaaS) product delivered entirely online. There
            are no physical goods, so nothing can be &quot;returned&quot; in the traditional sense.
            This policy explains how cancellations and refunds work for our subscription plans.
          </p>

          <h2>Free plan</h2>
          <p>
            Our free tier lets you evaluate {APP_NAME} before paying anything, with no credit card
            required. We encourage you to use the free plan to confirm the service fits your needs
            before upgrading to a paid subscription.
          </p>

          <h2>Subscriptions & cancellation</h2>
          <p>
            Paid plans renew automatically according to the billing cycle you select (monthly or
            annual) until you cancel. You can cancel at any time from your billing settings or the
            Stripe customer portal.
          </p>
          <p>
            Cancellation takes effect immediately on the day you cancel. Your account is downgraded
            to the free tier and you will not be billed again.
          </p>

          <h2>No refunds</h2>
          <p>
            To the maximum extent permitted by applicable law, all fees are non-refundable. We do
            not provide refunds or credits for:
          </p>
          <ul>
            <li>Partial billing periods, including unused days after cancellation</li>
            <li>Unused features, seats, or usage allowances</li>
            <li>Downgrades from a paid plan to the free tier mid-cycle</li>
            <li>Dissatisfaction with AI-generated output, which is inherently variable</li>
            <li>Account suspension or termination resulting from a violation of our{' '}
              <Link href="/terms" className="marketing-inline-link">Terms of service</Link> or{' '}
              <Link href="/acceptable-use" className="marketing-inline-link">Acceptable use policy</Link>
            </li>
          </ul>

          <h2>Exceptions</h2>
          <p>We will issue a refund or correction where:</p>
          <ul>
            <li>
              <strong>Billing errors occur:</strong> duplicate charges, charges after a confirmed
              cancellation, or charges in an incorrect amount are always refunded in full.
            </li>
            <li>
              <strong>The law requires it:</strong> where consumer protection laws in your
              jurisdiction grant non-waivable cancellation or refund rights, we honor those rights.
              Nothing in this policy limits rights you have under applicable law.
            </li>
          </ul>

          <h2>How to request a refund or report a billing issue</h2>
          <p>
            Email{' '}
            <a href={SUPPORT_MAILTO} className="marketing-inline-link">
              {SUPPORT_EMAIL}
            </a>{' '}
            from the address on your account with the subject &quot;Billing&quot;. Include the
            approximate charge date and amount. We respond to billing inquiries within 5 business
            days. Approved refunds are issued to the original payment method through Stripe, our
            payment processor, and typically appear within 5&ndash;10 business days depending on
            your bank.
          </p>

          <h2>Chargebacks</h2>
          <p>
            Please contact us before initiating a chargeback with your card issuer — most billing
            issues are resolved faster through support. We reserve the right to suspend accounts
            with fraudulent or abusive chargebacks.
          </p>

          <h2>Changes to this policy</h2>
          <p>
            We may update this policy from time to time. Material changes will be reflected by the
            &quot;Last updated&quot; date above. Continued use of paid plans after changes take
            effect constitutes acceptance of the updated policy.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about this policy:{' '}
            <a href={SUPPORT_MAILTO} className="marketing-inline-link">
              {SUPPORT_EMAIL}
            </a>
            . {PARENT_COMPANY_LEGAL_NAME} operates {APP_NAME} at {APP_DOMAIN}.
          </p>
        </div>
      </section>
    </MarketingPageLayout>
  );
}
