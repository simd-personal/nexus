import { MarketingPageLayout } from '@/components/marketing/MarketingPageLayout';
import { AI_EMPLOYEE_NAME, APP_DOMAIN, BRAND_TAGLINE, LEGAL_ENTITY_DESCRIPTION, TAGLINE } from '@/lib/constants';
import { createMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = createMarketingMetadata({
  title: 'About',
  description:
    `UpperDeck is where you onboard ${AI_EMPLOYEE_NAME}, an AI employee for client intelligence. Built for consultants and operators who need more delivery capacity.`,
  path: '/about',
  keywords: ['about UpperDeck', 'AI employees', 'client intelligence company'],
});

export default function AboutPage() {
  return (
    <MarketingPageLayout
      eyebrow="About"
      title={BRAND_TAGLINE}
      description={TAGLINE}
    >
      <section className="marketing-section bg-white">
        <div className="marketing-container max-w-3xl marketing-prose">
          <h2>Company</h2>
          <p>{LEGAL_ENTITY_DESCRIPTION}</p>

          <h2>What we&apos;re building</h2>
          <p>
            UpperDeck ({APP_DOMAIN}) helps consultants, agencies, and operators deliver more with
            AI employees. Stop reconstructing context from inboxes and slide decks and start every
            engagement with a clear picture of what matters, backed by evidence.
          </p>
          <p>
            At the center is {AI_EMPLOYEE_NAME}, an AI employee with full project context.{' '}
            {AI_EMPLOYEE_NAME} reads your meetings, emails, decks, and notes, then surfaces briefs,
            risks, follow ups, and answers with citations, not guesses. And {AI_EMPLOYEE_NAME} keeps
            getting more capable as we ship integrations, connectors, and new skills.
          </p>

          <h2>Who we serve</h2>
          <p>
            Solo consultants start free and upgrade when they outgrow a single client project.
            Agencies and regulated organizations use enterprise tenants with admin controls, access
            approvals, and optional PHI safeguards.
          </p>

          <h2>Our principles</h2>
          <ul>
            <li>AI employees should think in projects, not one off prompts</li>
            <li>AI should cite sources, especially when stakes are high</li>
            <li>Your AI employee should get more capable over time, not stay static</li>
            <li>Security and access control should scale from freelancer to enterprise</li>
            <li>Pricing should let you prove value before you pay</li>
          </ul>
        </div>
      </section>
    </MarketingPageLayout>
  );
}
