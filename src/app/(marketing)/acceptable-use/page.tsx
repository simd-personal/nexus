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
  title: 'Acceptable use policy',
  description:
    `UpperDeck acceptable use policy, operated by ${PARENT_COMPANY_LEGAL_NAME}. Rules for how the platform and its AI features may and may not be used.`,
  path: '/acceptable-use',
});

export default function AcceptableUsePage() {
  return (
    <MarketingPageLayout
      eyebrow="Legal"
      title="Acceptable use policy"
      description={`Rules for using ${APP_NAME} (${APP_DOMAIN}), operated by ${PARENT_COMPANY_LEGAL_NAME}.`}
    >
      <section className="marketing-section bg-white">
        <div className="marketing-container max-w-3xl marketing-prose">
          <p className="text-sm marketing-text-muted">Last updated: July 1, 2026</p>

          <h2>Who we are</h2>
          <p>{LEGAL_ENTITY_DESCRIPTION}</p>
          <p>
            This Acceptable Use Policy (&quot;AUP&quot;) is part of our{' '}
            <Link href="/terms" className="marketing-inline-link">Terms of service</Link>. By using{' '}
            {APP_NAME}, you agree to it. A violation of this policy is a material breach of the
            terms and may result in immediate suspension or termination of your account without
            refund.
          </p>

          <h2>Your use is your responsibility</h2>
          <p>
            {APP_NAME} is a general-purpose workspace tool. How you use it — including what you
            upload, what you generate, and what you do with the results — is entirely at your own
            discretion and risk. You are solely responsible for your use of the service, for the
            content you submit, and for ensuring your use complies with applicable laws, your
            client contracts, and any confidentiality or professional obligations you are subject
            to. {APP_NAME} and {PARENT_COMPANY_LEGAL_NAME} do not monitor, endorse, or take
            responsibility for how users choose to use the platform or its outputs.
          </p>

          <h2>Prohibited uses</h2>
          <p>You may not use {APP_NAME} to:</p>
          <ul>
            <li>Violate any applicable law or regulation, or promote or facilitate illegal activity</li>
            <li>Infringe the intellectual property, privacy, publicity, or other rights of any person</li>
            <li>
              Upload content you do not have the legal right to store, share, or process, including
              content that breaches confidentiality agreements or client contracts
            </li>
            <li>
              Harass, threaten, defame, or abuse others, or generate hateful, discriminatory, or
              violent content
            </li>
            <li>
              Exploit or harm minors in any way, including creating, uploading, or requesting child
              sexual abuse material
            </li>
            <li>
              Generate or spread disinformation, deepfakes, or synthetic media intended to deceive,
              or impersonate any person or organization without authorization
            </li>
            <li>Distribute spam, malware, phishing content, or other deceptive or harmful material</li>
          </ul>

          <h2>Prohibited AI uses</h2>
          <p>In addition, you may not use {APP_NAME}&apos;s AI features to:</p>
          <ul>
            <li>
              Make automated decisions with legal or similarly significant effects on individuals —
              including employment, housing, credit, insurance, healthcare, or legal decisions —
              without meaningful human review
            </li>
            <li>
              Obtain or substitute for individualized professional advice (legal, medical, or
              financial) that would ordinarily be provided by a licensed professional
            </li>
            <li>
              Circumvent safety measures, jailbreak, or use prompt injection to manipulate the
              service or extract system prompts, model details, or other users&apos; data
            </li>
            <li>Develop, train, or improve a competing AI model or product</li>
          </ul>

          <h2>Technical restrictions</h2>
          <p>You may not:</p>
          <ul>
            <li>Probe, scan, or breach the security of the service or its infrastructure</li>
            <li>Access accounts, projects, or data you are not authorized to view</li>
            <li>Reverse engineer, decompile, or copy the service or its underlying systems</li>
            <li>Abuse rate limits, scrape the service, or use automated means to extract data at scale</li>
            <li>Resell, sublicense, or provide the service to third parties without our written consent</li>
            <li>Interfere with or disrupt the service, other users, or connected networks</li>
          </ul>

          <h2>Sensitive & regulated data</h2>
          <p>
            You alone decide whether to upload information that is sensitive, confidential,
            regulated, or personal — including health information, financial records, or data
            covered by regulations such as HIPAA or GDPR. Unless you have a separate written
            agreement with us (such as an enterprise agreement with a Business Associate Agreement),
            you must not upload data whose processing requires such an agreement. {APP_NAME} is not
            responsible for sensitive data you choose to upload, share, or process through the
            platform. See our{' '}
            <Link href="/data-policy" className="marketing-inline-link">Data policy</Link> and{' '}
            <Link href="/privacy" className="marketing-inline-link">Privacy policy</Link> for
            details.
          </p>

          <h2>Enforcement</h2>
          <p>
            We may investigate suspected violations and may suspend or terminate accounts that
            violate this policy, with or without notice, at our sole discretion. We may also remove
            content and, where required, report unlawful activity to authorities. We are not
            obligated to monitor user content, and a failure to enforce this policy in one instance
            does not waive our right to enforce it later.
          </p>

          <h2>Reporting violations</h2>
          <p>
            To report abuse or a violation of this policy, contact{' '}
            <a href={SUPPORT_MAILTO} className="marketing-inline-link">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>

          <h2>Changes to this policy</h2>
          <p>
            We may update this policy as the product and legal landscape evolve. Material changes
            will be reflected by the &quot;Last updated&quot; date above. Continued use of the
            service after changes take effect constitutes acceptance.
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
