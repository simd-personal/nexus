import { MarketingPageLayout } from '@/components/marketing/MarketingPageLayout';
import { AI_EMPLOYEE_NAME, APP_DOMAIN, BRAND_TAGLINE } from '@/lib/constants';
import { createMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = createMarketingMetadata({
  title: 'About',
  description:
    'UpperDeck is an AI command center for client intelligence — helping consultants and operators see every project, deck, email, and decision in one place.',
  path: '/about',
  keywords: ['about UpperDeck', 'UpperDeck team', 'client intelligence company'],
});

export default function AboutPage() {
  return (
    <MarketingPageLayout
      eyebrow="About"
      title="Intelligence, elevated."
      description={BRAND_TAGLINE}
    >
      <section className="marketing-section bg-white">
        <div className="marketing-container max-w-3xl marketing-prose">
          <h2>What we&apos;re building</h2>
          <p>
            UpperDeck ({APP_DOMAIN}) is a command center for client work. We help consultants,
            agencies, and operators stop reconstructing context from inboxes and slide decks —
            and start every engagement with a clear, evidence-backed picture of what matters.
          </p>
          <p>
            At the center is {AI_EMPLOYEE_NAME}, an AI employee with full project context. She reads
            your meetings, emails, decks, and notes — then surfaces briefs, risks, follow-ups, and
            answers with citations, not guesses.
          </p>

          <h2>Who we serve</h2>
          <p>
            Solo consultants start free and upgrade when they outgrow a single client project.
            Agencies and regulated organizations use enterprise tenants with admin controls, access
            approvals, and optional PHI safeguards.
          </p>

          <h2>Our principles</h2>
          <ul>
            <li>Client context should live in one place, not across twelve tabs</li>
            <li>AI should cite sources — especially when stakes are high</li>
            <li>Security and access control should scale from freelancer to enterprise</li>
            <li>Pricing should let you prove value before you pay</li>
          </ul>
        </div>
      </section>
    </MarketingPageLayout>
  );
}
