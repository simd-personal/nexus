import { MarketingPageLayout } from '@/components/marketing/MarketingPageLayout';
import { APP_DOMAIN } from '@/lib/constants';
import { createMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = createMarketingMetadata({
  title: 'Terms of service',
  description:
    'UpperDeck terms of service — rules for using our AI client intelligence platform, including accounts, content, and subscriptions.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <MarketingPageLayout
      eyebrow="Legal"
      title="Terms of service"
      description={`Terms for using UpperDeck at ${APP_DOMAIN}.`}
    >
      <section className="marketing-section bg-white">
        <div className="marketing-container max-w-3xl marketing-prose">
          <p className="text-sm text-[var(--ud-slate)]">Last updated: June 27, 2026</p>

          <h2>Agreement</h2>
          <p>
            By creating an account or using UpperDeck, you agree to these terms. If you use UpperDeck
            on behalf of an organization, you represent that you have authority to bind that
            organization.
          </p>

          <h2>The service</h2>
          <p>
            UpperDeck provides a web-based workspace for organizing client projects and generating
            AI-assisted intelligence such as briefs, search, and chat. Features may change as we
            improve the product. Enterprise features are provided under separate agreements.
          </p>

          <h2>Accounts</h2>
          <p>
            You are responsible for safeguarding your login credentials and for activity under your
            account. You must provide accurate registration information and keep it up to date.
          </p>

          <h2>Your content</h2>
          <p>
            You retain ownership of content you upload. You grant UpperDeck a limited license to
            host, process, and display that content solely to provide the service — including
            sending portions to AI subprocessors as needed for features you use.
          </p>
          <p>
            You are responsible for ensuring you have the right to upload content and that its
            processing complies with your client contracts and applicable law.
          </p>

          <h2>Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the service for unlawful purposes or to violate others&apos; rights</li>
            <li>Attempt to breach security or access data you are not authorized to view</li>
            <li>Reverse engineer or abuse rate limits or API endpoints</li>
            <li>Upload malware or content intended to disrupt the service</li>
          </ul>

          <h2>Subscriptions & billing</h2>
          <p>
            Paid plans renew according to the billing cycle you select until canceled. Fees are
            processed by Stripe. Refunds are handled according to our billing policies and applicable
            law. Free tier limits (such as project and message caps) may change with notice.
          </p>

          <h2>Disclaimers</h2>
          <p>
            UpperDeck and its AI features are provided &quot;as is.&quot; AI-generated output may be
            incomplete or incorrect. You are responsible for reviewing outputs before relying on
            them with clients or in business decisions. UpperDeck is not a substitute for
            professional, legal, or medical advice.
          </p>

          <h2>Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, UpperDeck is not liable for indirect, incidental,
            or consequential damages arising from use of the service. Our total liability for any
            claim is limited to the amount you paid us in the twelve months before the claim.
          </p>

          <h2>Termination</h2>
          <p>
            You may stop using UpperDeck at any time. We may suspend or terminate accounts that
            violate these terms or pose security risk. Upon termination, your right to access the
            service ends.
          </p>

          <h2>Contact</h2>
          <p>Questions about these terms: legal@{APP_DOMAIN}</p>
        </div>
      </section>
    </MarketingPageLayout>
  );
}
