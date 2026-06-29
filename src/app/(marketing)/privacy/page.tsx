import { MarketingPageLayout } from '@/components/marketing/MarketingPageLayout';
import {
  APP_DOMAIN,
  LEGAL_PRIVACY_CONTROLLER,
  PARENT_COMPANY_LEGAL_NAME,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
} from '@/lib/constants';
import { createMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = createMarketingMetadata({
  title: 'Privacy policy',
  description:
    `UpperDeck privacy policy, operated by ${PARENT_COMPANY_LEGAL_NAME}. How we collect, use, and protect your account data and client project content.`,
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <MarketingPageLayout
      eyebrow="Legal"
      title="Privacy policy"
      description={`How UpperDeck (${APP_DOMAIN}), operated by ${PARENT_COMPANY_LEGAL_NAME}, handles your data.`}
    >
      <section className="marketing-section bg-white">
        <div className="marketing-container max-w-3xl marketing-prose">
          <p className="text-sm marketing-text-muted">Last updated: June 28, 2026</p>

          <h2>Overview</h2>
          <p>{LEGAL_PRIVACY_CONTROLLER}</p>
          <p>
            This policy describes what information we collect, how we use it, and the choices you
            have when you use UpperDeck.
          </p>

          <h2>Information we collect</h2>
          <ul>
            <li>
              <strong>Account information:</strong> email address, name, and authentication
              credentials you provide when signing up.
            </li>
            <li>
              <strong>Project content:</strong> files, text, and metadata you upload or paste
              into projects, including meeting notes, emails, decks, and transcripts.
            </li>
            <li>
              <strong>Usage data:</strong> basic logs such as feature usage, errors, and performance
              metrics to operate and improve the service.
            </li>
            <li>
              <strong>Billing data:</strong> subscription status and Stripe customer identifiers.
              Payment card details are processed by Stripe, not stored on our servers.
            </li>
          </ul>

          <h2>How we use information</h2>
          <p>We use your information solely to:</p>
          <ul>
            <li>Provide, secure, and maintain the UpperDeck service</li>
            <li>Process files and generate AI-assisted briefs, search, and chat responses you request</li>
            <li>Authenticate users and enforce access controls</li>
            <li>Process subscriptions and communicate about your account</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p>
            We do not use your project content for advertising, unrelated product development, or
            to train machine learning or AI models. Your content remains yours.
          </p>

          <h2>Your data & model training</h2>
          <p>
            You retain ownership of the files, text, and other content you submit to UpperDeck. We
            do not claim ownership over your project content. We process it only to deliver the
            features you use.
          </p>
          <p>
            We do not use your project content to train our own models or third-party foundation
            models. We do not sell your project content. We do not access your content for our own
            independent business purposes beyond operating, securing, and maintaining the service.
          </p>

          <h2>AI processing</h2>
          <p>
            When you use AI-powered features, relevant portions of your project content may be sent
            to third-party AI providers (such as OpenAI and Anthropic) to generate responses. We send
            only what is required for each request. These providers process data under their own
            terms and enterprise API policies; we configure our integrations for service delivery,
            not model training on your content.
          </p>
          <p>
            Do not upload information you are not permitted to share with subprocessors under your
            client agreements or applicable law.
          </p>

          <h2>Sensitive information</h2>
          <p>
            You alone decide what information is sensitive, confidential, regulated, or personal.
            UpperDeck does not define sensitivity on your behalf. You are solely responsible for
            reviewing your content and redacting or excluding anything you consider sensitive before
            or after using the service.
          </p>
          <p>
            Optional safeguards (such as organization-level PHI redaction) are assistive tools only.
            UpperDeck is not responsible for sensitive information you choose to upload or for how
            you or others use your content or AI-generated outputs. We do not monitor or verify the
            sensitivity or legality of user-submitted content.
          </p>

          <h2>Data storage & security</h2>
          <p>
            Data is stored in Supabase (PostgreSQL and object storage) with row-level security
            policies. API keys for AI and payment providers are kept server-side. Organization
            tenants may enable additional safeguards such as PHI redaction during file processing.
          </p>

          <h2>Data retention & account deletion</h2>
          <p>
            We retain account and project data only while your account is active. You may delete
            individual projects and files within the product at any time.
          </p>
          <p>
            When you delete your UpperDeck account, we permanently erase your personal information,
            project content, uploaded files, chat history, and related metadata from our databases
            and storage. We do not keep copies for recovery or marketing—deleted accounts are treated
            as if they never existed.
          </p>
          <p>
            Stripe may retain payment transaction records separately under its own privacy policy.
            We do not retain your project content or account profile after deletion.
          </p>

          <h2>Your rights</h2>
          <p>
            Depending on your location, you may have rights to access, correct, delete, or export
            your personal data. Contact us at{' '}
            <a href={SUPPORT_MAILTO} className="marketing-inline-link">
              {SUPPORT_EMAIL}
            </a>{' '}
            for requests.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about this policy:{' '}
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
