import Link from 'next/link';
import { Check } from 'lucide-react';
import { MarketingPageLayout } from '@/components/marketing/MarketingPageLayout';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';
import { createMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = createMarketingMetadata({
  title: 'For freelancers',
  description:
    'Onboard Sunny, an AI employee for freelancers on Upwork, Fiverr, and beyond. Keep every client gig organized with briefs, follow ups, and cited answers from your own files.',
  path: '/for-freelancers',
  keywords: [
    'AI tool for freelancers',
    'Upwork client management',
    'Fiverr project organization',
    'freelance client tracker',
    'AI assistant for freelancers',
  ],
});

export default function ForFreelancersPage() {
  return (
    <MarketingPageLayout
      eyebrow="Solutions"
      title="An AI employee for freelancers juggling gigs and clients"
      description={`Every new gig on Upwork or Fiverr arrives with its own briefs, revisions, and buried requirements. Onboard ${AI_EMPLOYEE_NAME}, an AI employee who keeps each client separate so you never mix up deliverables or miss a deadline again.`}
    >
      <section className="marketing-section bg-white">
        <div className="marketing-container grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="marketing-section-title">Look like an agency of one</h2>
            <p className="marketing-section-body mt-4">
              Start free with one active client project. When repeat clients and referrals stack
              up, Pro unlocks unlimited projects and unlimited {AI_EMPLOYEE_NAME} so every gig
              keeps its own context — no copy-pasting between chat threads and folders.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                'Drop in client briefs, revision emails, and call recordings per gig',
                'Ask what the client actually asked for before you deliver',
                'Catch scope changes and contradictions across messages',
                'Draft polished updates and handoffs with cited sources',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] marketing-text">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-accent)]" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="marketing-seo-callout">
            <h3 className="font-semibold text-[var(--ud-graphite)]">Typical freelancer workflow</h3>
            <ol className="mt-4 space-y-4 text-sm leading-relaxed marketing-text">
              <li>1. Create a project per client or marketplace gig</li>
              <li>2. Forward the brief, revision requests, and kickoff notes</li>
              <li>3. Ask {AI_EMPLOYEE_NAME} what changed before each delivery</li>
              <li>4. Send the update that wins the five star review</li>
            </ol>
            <Link href="/pricing" className="marketing-inline-link mt-6 inline-block">
              See freelancer pricing →
            </Link>
          </div>
        </div>
      </section>
    </MarketingPageLayout>
  );
}
