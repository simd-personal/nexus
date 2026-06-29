import Link from 'next/link';
import { Check } from 'lucide-react';
import { MarketingPageLayout } from '@/components/marketing/MarketingPageLayout';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';
import { createMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = createMarketingMetadata({
  title: 'For consultants',
  description:
    'Onboard Sunny, an AI employee for consultants juggling multiple clients. One workspace for briefs, decks, emails, and follow ups with cited client intelligence.',
  path: '/for-consultants',
  keywords: [
    'AI employee for consultants',
    'freelance consultant software',
    'multi client project tool',
    'consulting AI assistant',
  ],
});

export default function ForConsultantsPage() {
  return (
    <MarketingPageLayout
      eyebrow="Solutions"
      title="AI employees for consultants juggling multiple clients"
      description={`You cannot afford to miss a timeline shift, a contradictory deck, or a follow up buried in email. Onboard ${AI_EMPLOYEE_NAME}, an AI employee who keeps every engagement separate and gets more useful as UpperDeck ships new features.`}
    >
      <section className="marketing-section bg-white">
        <div className="marketing-container grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="marketing-section-title">From one client to a full book of business</h2>
            <p className="marketing-section-body mt-4">
              Start free with one active client project, your AI employee on a single engagement.
              When you land your second and third client, Pro unlocks unlimited projects and
              unlimited {AI_EMPLOYEE_NAME} so context never bleeds between clients.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                'Upload meeting notes, decks, and email threads per client',
                'Get executive briefs before every call',
                'Spot risks and contradictions across documents',
                'Draft follow ups and decks with cited sources',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] marketing-text">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-accent)]" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="marketing-seo-callout">
            <h3 className="font-semibold text-[var(--ud-graphite)]">Typical consultant workflow</h3>
            <ol className="mt-4 space-y-4 text-sm leading-relaxed marketing-text">
              <li>1. Create a project per client engagement</li>
              <li>2. Drop in kickoff decks, discovery calls, and stakeholder emails</li>
              <li>3. Ask {AI_EMPLOYEE_NAME} what changed since last week</li>
              <li>4. Walk into the steering committee with a fresh brief</li>
            </ol>
            <Link href="/pricing" className="marketing-inline-link mt-6 inline-block">
              See consultant pricing →
            </Link>
          </div>
        </div>
      </section>
    </MarketingPageLayout>
  );
}
