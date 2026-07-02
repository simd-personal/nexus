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
  title: 'Data policy',
  description:
    `UpperDeck data policy, operated by ${PARENT_COMPANY_LEGAL_NAME}. How uploaded content is stored, processed, and deleted — and your responsibilities for the data you submit.`,
  path: '/data-policy',
});

export default function DataPolicyPage() {
  return (
    <MarketingPageLayout
      eyebrow="Legal"
      title="Data policy"
      description={`How ${APP_NAME} (${APP_DOMAIN}), operated by ${PARENT_COMPANY_LEGAL_NAME}, stores, processes, and protects the data you submit.`}
    >
      <section className="marketing-section bg-white">
        <div className="marketing-container max-w-3xl marketing-prose">
          <p className="text-sm marketing-text-muted">Last updated: July 1, 2026</p>

          <h2>Who we are</h2>
          <p>{LEGAL_ENTITY_DESCRIPTION}</p>
          <p>
            This Data policy explains how content you submit to {APP_NAME} is stored, processed,
            shared with subprocessors, and deleted. It complements our{' '}
            <Link href="/privacy" className="marketing-inline-link">Privacy policy</Link>, which
            covers personal information more broadly, and our{' '}
            <Link href="/terms" className="marketing-inline-link">Terms of service</Link>.
          </p>

          <h2>You own your data</h2>
          <p>
            You retain full ownership of all files, text, and other content you upload or paste
            into {APP_NAME} (&quot;Your Content&quot;). We claim no ownership over it. You grant us
            only the limited license needed to host, transmit, and process Your Content to deliver
            the features you use.
          </p>

          <h2>What we do with your data</h2>
          <ul>
            <li>
              <strong>Storage:</strong> uploads are stored in private object storage and a
              PostgreSQL database (Supabase on AWS) with row-level security. Files are never served
              from public URLs.
            </li>
            <li>
              <strong>Processing:</strong> we extract text, generate embeddings for search, and —
              when you invoke AI features — send relevant portions of Your Content to AI
              subprocessors (such as OpenAI and Anthropic) to generate the response you requested.
              We send only what each request requires.
            </li>
            <li>
              <strong>Security:</strong> traffic is encrypted in transit (TLS); data at rest
              inherits cloud-provider encryption. Provider API keys are kept server-side.
            </li>
          </ul>

          <h2>What we do not do with your data</h2>
          <ul>
            <li>We do not use Your Content to train our models or any third-party AI models</li>
            <li>We do not sell Your Content or use it for advertising</li>
            <li>
              We do not access Your Content for purposes beyond operating, securing, and
              maintaining the service
            </li>
            <li>We do not share Your Content with third parties except the subprocessors needed to run the service</li>
          </ul>

          <h2>Your responsibilities for the data you submit</h2>
          <p>
            You alone decide what to upload. You are solely responsible for Your Content, including:
          </p>
          <ul>
            <li>Having the legal right to upload, store, and process it through {APP_NAME} and our subprocessors</li>
            <li>
              Complying with your client agreements, confidentiality obligations, professional
              duties, and applicable data protection laws
            </li>
            <li>
              Identifying and redacting or excluding information you consider sensitive,
              confidential, regulated, or personal — before or after using the service
            </li>
          </ul>
          <p>
            {APP_NAME} does not define what counts as sensitive on your behalf, and does not
            monitor, audit, or verify the sensitivity or legality of user-submitted content. To the
            maximum extent permitted by law, {APP_NAME} and {PARENT_COMPANY_LEGAL_NAME} are not
            responsible or liable for sensitive data you choose to upload, share, or process
            through the platform, for how you or third parties use Your Content or AI-generated
            outputs, or for any disclosure, loss, or misuse of information you submit. Optional
            safeguards (such as organization-level PHI redaction) are assistive tools only and do
            not shift this responsibility to us.
          </p>

          <h2>Regulated data</h2>
          <p>
            Unless you have a separate written agreement with us that covers it (for example, an
            enterprise agreement with a Business Associate Agreement for HIPAA-regulated data), you
            must not upload data whose processing legally requires such an agreement. Contact us
            about enterprise plans if you need contractual coverage for regulated data.
          </p>

          <h2>Subprocessors</h2>
          <p>Core subprocessors used to deliver the service:</p>
          <ul>
            <li><strong>Supabase / AWS</strong> — database, authentication, and file storage</li>
            <li><strong>OpenAI and Anthropic</strong> — AI processing when you use AI features</li>
            <li><strong>Stripe</strong> — payment processing (card details never touch our servers)</li>
            <li><strong>Vercel</strong> — application hosting and analytics</li>
          </ul>
          <p>
            Subprocessors process data under their own terms and enterprise API policies. We
            configure our integrations for service delivery, not for training on your content.
          </p>

          <h2>Retention & deletion</h2>
          <p>
            We retain Your Content only while your account is active. You can delete individual
            files and projects at any time from within the product. When you delete your account,
            we permanently erase your profile, projects, files, chat history, and related metadata.
            We do not keep copies for recovery or marketing. Stripe may retain minimal transaction
            records under its own policies and applicable law.
          </p>

          <h2>Data export</h2>
          <p>
            You may request an export of your data by contacting{' '}
            <a href={SUPPORT_MAILTO} className="marketing-inline-link">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>

          <h2>Changes to this policy</h2>
          <p>
            We may update this policy from time to time. Material changes will be reflected by the
            &quot;Last updated&quot; date above.
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
