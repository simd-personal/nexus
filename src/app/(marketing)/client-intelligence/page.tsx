import Link from 'next/link';
import { Check } from 'lucide-react';
import { MarketingPageLayout } from '@/components/marketing/MarketingPageLayout';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';
import { createMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = createMarketingMetadata({
  title: 'Client intelligence software',
  description:
    'Client intelligence means knowing what changed, what is at risk, and what to do next. UpperDeck gives you Sunny, your first AI employee focused on that work, getting more powerful over time.',
  path: '/client-intelligence',
  keywords: [
    'client intelligence',
    'client intelligence platform',
    'client context software',
    'AI client briefs',
    'client risk detection',
  ],
});

export default function ClientIntelligencePage() {
  return (
    <MarketingPageLayout
      eyebrow="Client intelligence"
      title="Client intelligence and the AI employee who delivers it"
      description="Client intelligence is the practice of turning scattered client artifacts into actionable context: briefs, risks, timelines, and follow ups you can trust. Sunny is the AI employee who does that work for you."
    >
      <section className="marketing-section bg-white">
        <div className="marketing-container max-w-3xl">
          <h2 className="marketing-section-title">The problem: context is everywhere except one place</h2>
          <p className="marketing-section-body mt-4">
            Most client knowledge lives in inboxes, slide libraries, call recordings, and shared
            folders. When a timeline shifts in a meeting but the deck still says Q2, nobody notices
            until the client does. Client intelligence software closes that gap.
          </p>
          <p className="marketing-section-body mt-4">
            UpperDeck ingests those sources per project, indexes them for semantic search, and puts{' '}
            {AI_EMPLOYEE_NAME}, your AI employee, to work surfacing briefs, contradictions, critical
            items, and suggested follow ups with citations back to the original file or transcript.
            And as we add integrations and workflows, your AI employee handles more of the reading for
            you.
          </p>
        </div>
      </section>

      <section className="marketing-section marketing-section-gradient">
        <div className="marketing-container">
          <h2 className="marketing-section-title">What good client intelligence includes</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[
              {
                title: 'Unified project memory',
                body: 'Meetings, emails, decks, PDFs, audio, and notes in one searchable workspace per client.',
              },
              {
                title: 'Executive briefs',
                body: 'Walk into every call with a concise summary of what changed since you last spoke.',
              },
              {
                title: 'Risk and contradiction detection',
                body: 'Flag timeline drift, conflicting statements, and ownership gaps before they escalate.',
              },
              {
                title: 'Actionable follow ups',
                body: 'Turn unstructured conversations into clear next steps your team can execute.',
              },
            ].map((item) => (
              <div key={item.title} className="marketing-feature-card">
                <h3 className="text-lg font-semibold text-[var(--ud-graphite)]">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--ud-slate)]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-section bg-white">
        <div className="marketing-container max-w-3xl">
          <h2 className="marketing-section-title">Who uses client intelligence?</h2>
          <ul className="mt-6 space-y-3">
            {[
              'Independent consultants managing multiple engagements',
              'Agency delivery teams sharing context across roles',
              'Operators and chiefs of staff supporting executive client relationships',
              'Healthcare and regulated consultancies with stricter data controls',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-[15px] text-[var(--ud-slate)]">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-accent)]" strokeWidth={2.5} />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-[var(--ud-slate)]">
            Learn how UpperDeck applies client intelligence in practice on the{' '}
            <Link href="/product" className="marketing-inline-link">
              product page
            </Link>{' '}
            or start free on the{' '}
            <Link href="/pricing" className="marketing-inline-link">
              pricing page
            </Link>
            .
          </p>
        </div>
      </section>
    </MarketingPageLayout>
  );
}
