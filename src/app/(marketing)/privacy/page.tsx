import { MarketingPageLayout } from '@/components/marketing/MarketingPageLayout';
import { APP_DOMAIN } from '@/lib/constants';
import { createMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = createMarketingMetadata({
  title: 'Privacy policy',
  description:
    'UpperDeck privacy policy. How we collect, use, and protect your account data and client project content.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <MarketingPageLayout
      eyebrow="Legal"
      title="Privacy policy"
      description={`How UpperDeck (${APP_DOMAIN}) handles your data.`}
    >
      <section className="marketing-section bg-white">
        <div className="marketing-container max-w-3xl marketing-prose">
          <p className="text-sm text-[var(--ud-slate)]">Last updated: June 27, 2026</p>

          <h2>Overview</h2>
          <p>
            UpperDeck provides an AI-powered workspace for client project intelligence. This policy
            describes what information we collect, how we use it, and the choices you have.
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
          <p>We use your information to:</p>
          <ul>
            <li>Provide, secure, and improve the UpperDeck service</li>
            <li>Process files and generate AI-assisted briefs, search, and chat responses</li>
            <li>Authenticate users and enforce access controls</li>
            <li>Process subscriptions and communicate about your account</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>AI processing</h2>
          <p>
            Project content may be processed by third-party AI providers (such as OpenAI and
            Anthropic) to power features like semantic search, brief generation, and chat. We send
            only the content required for each request. Do not upload information you are not
            permitted to share with subprocessors under your client agreements.
          </p>

          <h2>Data storage & security</h2>
          <p>
            Data is stored in Supabase (PostgreSQL and object storage) with row-level security
            policies. API keys for AI and payment providers are kept server-side. Organization
            tenants may enable additional safeguards such as PHI redaction during file processing.
          </p>

          <h2>Data retention</h2>
          <p>
            We retain account and project data while your account is active. You may delete projects
            and files within the product. Contact us to request account deletion.
          </p>

          <h2>Your rights</h2>
          <p>
            Depending on your location, you may have rights to access, correct, delete, or export
            your personal data. Contact us at privacy@{APP_DOMAIN} for requests.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about this policy: privacy@{APP_DOMAIN}
          </p>
        </div>
      </section>
    </MarketingPageLayout>
  );
}
