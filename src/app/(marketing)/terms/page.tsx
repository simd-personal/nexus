import Link from 'next/link';
import { MarketingPageLayout } from '@/components/marketing/MarketingPageLayout';
import {
  APP_DOMAIN,
  LEGAL_ENTITY_DESCRIPTION,
  LEGAL_TERMS_PARTY,
  PARENT_COMPANY_LEGAL_NAME,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
} from '@/lib/constants';
import { createMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = createMarketingMetadata({
  title: 'Terms of service',
  description:
    `UpperDeck terms of service, operated by ${PARENT_COMPANY_LEGAL_NAME}. Rules for using our AI client intelligence platform, including accounts, content, and subscriptions.`,
  path: '/terms',
});

export default function TermsPage() {
  return (
    <MarketingPageLayout
      eyebrow="Legal"
      title="Terms of service"
      description={`Terms for using UpperDeck at ${APP_DOMAIN}, operated by ${PARENT_COMPANY_LEGAL_NAME}.`}
    >
      <section className="marketing-section bg-white">
        <div className="marketing-container max-w-3xl marketing-prose">
          <p className="text-sm marketing-text-muted">Last updated: June 28, 2026</p>

          <h2>Who we are</h2>
          <p>{LEGAL_ENTITY_DESCRIPTION}</p>
          <p>{LEGAL_TERMS_PARTY}</p>

          <h2>Agreement</h2>
          <p>
            By creating an account or using UpperDeck, you agree to these terms. If you use UpperDeck
            on behalf of an organization, you represent that you have authority to bind that
            organization.
          </p>
          <p>
            These terms incorporate our{' '}
            <Link href="/privacy" className="marketing-inline-link">Privacy policy</Link>,{' '}
            <Link href="/data-policy" className="marketing-inline-link">Data policy</Link>,{' '}
            <Link href="/acceptable-use" className="marketing-inline-link">Acceptable use policy</Link>, and{' '}
            <Link href="/refund-policy" className="marketing-inline-link">Return &amp; refund policy</Link>{' '}
            by reference.
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
            You retain full ownership of all content you upload, paste, or otherwise submit to
            UpperDeck (&quot;Your Content&quot;). Your Content is yours. UpperDeck does not claim
            ownership over it.
          </p>
          <p>
            You grant UpperDeck a limited, non-exclusive license to host, transmit, and process Your
            Content solely as necessary to provide the features you use, including sending portions
            to AI subprocessors when you invoke AI-powered features.
          </p>
          <p>
            You are solely responsible for Your Content, including ensuring you have the right to
            upload it and that its storage and processing comply with your client contracts,
            confidentiality obligations, and applicable law.
          </p>

          <h2>Sensitive information & your responsibility</h2>
          <p>
            You alone decide what information is sensitive, confidential, regulated, personal, or
            otherwise restricted—including, without limitation, health information, financial data,
            trade secrets, attorney-client materials, or any data you treat as sensitive. UpperDeck
            does not define sensitivity categories on your behalf.
          </p>
          <p>
            You are solely responsible for reviewing Your Content and redacting, removing, or
            excluding any information you consider sensitive before or after using the service.
            Optional safeguards (such as organization-level PHI redaction) are assistive tools only
            and do not shift responsibility to UpperDeck.
          </p>
          <p>
            UpperDeck is not responsible for sensitive, confidential, regulated, or personal
            information you choose to upload, store, share, or process through the platform, nor for
            how you or third parties use Your Content or AI-generated outputs. We do not monitor,
            audit, or verify the sensitivity, legality, or appropriateness of Your Content.
          </p>
          <p>
            To the maximum extent permitted by law, you agree that UpperDeck has no liability
            arising from Your Content, its accuracy, its sensitivity, how it is used, or any
            disclosure, loss, or misuse of information you submit to the service.
          </p>

          <h2>Your data & AI use</h2>
          <p>
            UpperDeck processes Your Content only to operate the service and the features you
            request—for example, storing files, enabling search, and generating briefs or chat
            responses. We do not use Your Content to train machine learning or AI models, and we do
            not sell Your Content.
          </p>
          <p>
            We do not access Your Content for our own independent business purposes beyond
            providing, securing, maintaining, and improving the service. We do not review your
            projects for marketing, advertising, or unrelated product development.
          </p>

          <h2>Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the service for unlawful purposes or to violate others&apos; rights</li>
            <li>Attempt to breach security or access data you are not authorized to view</li>
            <li>Reverse engineer or abuse rate limits or API endpoints</li>
            <li>Upload malware or content intended to disrupt the service</li>
          </ul>
          <p>
            Full usage rules, including AI-specific restrictions, are set out in our{' '}
            <Link href="/acceptable-use" className="marketing-inline-link">
              Acceptable use policy
            </Link>
            , which is part of these terms.
          </p>

          <h2>Subscriptions & billing</h2>
          <p>
            Paid plans renew according to the billing cycle you select until you cancel. Fees are
            processed by Stripe. Free tier limits (such as project and message caps) may change with
            notice.
          </p>
          <p>
            When you cancel a paid subscription, cancellation takes effect immediately on the same
            day you cancel. You will not receive a refund for any unused portion of the current
            billing period, including partial months or years. No prorated credits are issued. See
            our{' '}
            <Link href="/refund-policy" className="marketing-inline-link">
              Return &amp; refund policy
            </Link>{' '}
            for details, including billing-error exceptions.
          </p>

          <h2>Account deletion</h2>
          <p>
            You may delete your account at any time from Settings or by contacting us at{' '}
            <a href={SUPPORT_MAILTO} className="marketing-inline-link">
              {SUPPORT_EMAIL}
            </a>
            . When your account is deleted, we permanently remove your profile,
            projects, uploaded files, and associated data from our systems. We do not retain backups
            or archives of deleted account data—it is as if the account never existed, except where
            payment processors such as Stripe must retain minimal transaction records under their
            own policies and applicable law.
          </p>

          <h2>Disclaimers</h2>
          <p>
            UpperDeck and its AI features are provided &quot;as is&quot; and &quot;as available,&quot;
            without warranties of any kind, whether express or implied, including implied warranties
            of merchantability, fitness for a particular purpose, and non-infringement.
          </p>
          <p>
            AI-generated output may be incomplete, inaccurate, or inappropriate. You are solely
            responsible for reviewing all outputs before relying on them with clients, patients,
            regulators, or in business, legal, or medical decisions. UpperDeck is not a substitute
            for professional, legal, or medical advice.
          </p>
          <p>
            UpperDeck makes no guarantee that the service will prevent disclosure of sensitive
            information, satisfy any regulatory or contractual requirement, or produce error-free
            results. You use the service at your own risk.
          </p>

          <h2>Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, UpperDeck and its officers, directors,
            employees, and suppliers will not be liable for any indirect, incidental, special,
            consequential, exemplary, or punitive damages, or for any loss of profits, revenue,
            data, goodwill, or business opportunity, arising from or related to your use of the
            service or Your Content—even if we have been advised of the possibility of such damages.
          </p>
          <p>
            Without limiting the foregoing, UpperDeck is not liable for: (a) the contents, accuracy,
            or sensitivity of Your Content; (b) how you or others use Your Content or service
            outputs; (c) unauthorized or inappropriate disclosure of information you submit; (d)
            your failure to redact or protect sensitive information; or (e) any regulatory,
            contractual, or third-party claims related to Your Content.
          </p>
          <p>
            Our total aggregate liability for any claim arising out of or relating to these terms or
            the service is limited to the greater of (i) the amount you paid UpperDeck in the twelve
            months before the claim, or (ii) one hundred U.S. dollars ($100).
          </p>

          <h2>Termination</h2>
          <p>
            You may stop using UpperDeck at any time. We may suspend or terminate accounts that
            violate these terms or pose security risk. Upon termination, your right to access the
            service ends.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about these terms:{' '}
            <a href={SUPPORT_MAILTO} className="marketing-inline-link">
              {SUPPORT_EMAIL}
            </a>
            . {PARENT_COMPANY_LEGAL_NAME} operates UpperDeck at {APP_DOMAIN}.
          </p>
        </div>
      </section>
    </MarketingPageLayout>
  );
}
