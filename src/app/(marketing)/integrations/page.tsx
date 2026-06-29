import Link from 'next/link';
import { MarketingPageLayout } from '@/components/marketing/MarketingPageLayout';
import { INTEGRATIONS, INTEGRATION_STATUS_LABEL } from '@/lib/marketing/integrations';
import { createMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = createMarketingMetadata({
  title: 'Integrations',
  description:
    'Connect UpperDeck to Gmail, Outlook, Slack, Google Drive, Teams, Zoom, Notion, HubSpot, Salesforce, and more. Each connector makes your AI employee smarter about client work.',
  path: '/integrations',
  keywords: [
    'consultant integrations',
    'Slack client context',
    'Gmail project sync',
    'CRM client intelligence',
  ],
});

export default function IntegrationsPage() {
  return (
    <MarketingPageLayout
      eyebrow="Integrations"
      title="Connect the tools where client work already lives"
      description="UpperDeck starts with flexible file upload today. Connectors bring email, chat, storage, meetings, and CRM data into each client project and make Sunny a more capable AI employee over time."
    >
      <section className="marketing-section bg-white">
        <div className="marketing-container">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INTEGRATIONS.map((integration) => (
              <div key={integration.name} className="marketing-integration-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider marketing-text">
                      {integration.category}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-[var(--ud-graphite)]">
                      {integration.name}
                    </h2>
                  </div>
                  <span
                    className={`marketing-status-badge marketing-status-${integration.status}`}
                  >
                    {INTEGRATION_STATUS_LABEL[integration.status]}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed marketing-text">
                  {integration.description}
                </p>
              </div>
            ))}
          </div>

          <div className="marketing-seo-callout mt-12">
            <p className="text-sm marketing-text">
              Need SSO, CRM sync, or a custom connector for your organization?{' '}
              <Link href="/request-quote" className="marketing-inline-link">
                Request an enterprise quote
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </MarketingPageLayout>
  );
}
