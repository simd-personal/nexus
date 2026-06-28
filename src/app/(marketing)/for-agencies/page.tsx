import Link from 'next/link';
import { Check } from 'lucide-react';
import { MarketingPageLayout } from '@/components/marketing/MarketingPageLayout';
import { createMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = createMarketingMetadata({
  title: 'For agencies',
  description:
    'UpperDeck gives agencies and delivery teams a shared client intelligence layer — admin controls, organization workspaces, audit trails, and PHI options for regulated work.',
  path: '/for-agencies',
  keywords: [
    'agency client management',
    'multi-tenant client workspace',
    'delivery team intelligence',
    'agency knowledge management',
  ],
});

export default function ForAgenciesPage() {
  return (
    <MarketingPageLayout
      eyebrow="Solutions"
      title="Shared client context for agency delivery teams"
      description="Principals, PMs, and strategists should not reconstruct context from Slack threads and shared drives. UpperDeck gives every team member the same source of truth."
    >
      <section className="marketing-section bg-white">
        <div className="marketing-container">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="marketing-section-title">When one client spans a dozen people</h2>
              <p className="marketing-section-body mt-4">
                Organization tenants add multi-project workspaces, role-based access, access request
                approvals, and audit-friendly activity — sold via quote for teams from 10 to 500+
                seats.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  'Organization-scoped projects and members',
                  'Admin roles for owners and team leads',
                  'Healthcare PHI redaction on uploads',
                  'SSO / SAML available on request',
                  'Slack, email, and calendar connectors (roadmap)',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] text-[var(--ud-slate)]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7c6cf0]" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              {[
                {
                  title: 'Software & digital agencies',
                  body: 'Keep delivery aligned when multiple squads touch the same client account.',
                },
                {
                  title: 'Healthcare consultancies',
                  body: 'Enable PHI redaction and access controls for regulated client engagements.',
                },
                {
                  title: 'Management consultancies',
                  body: 'Give partners a live brief across workstreams without status-meeting theater.',
                },
              ].map((item) => (
                <div key={item.title} className="marketing-feature-card">
                  <h3 className="font-semibold text-[var(--ud-graphite)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ud-slate)]">{item.body}</p>
                </div>
              ))}
              <Link href="/request-quote" className="marketing-inline-link text-sm">
                Request organization pricing →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingPageLayout>
  );
}
