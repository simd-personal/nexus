import { RequestQuotePageContent } from '@/components/enterprise/RequestQuoteForm';
import { createMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = createMarketingMetadata({
  title: 'Talk to sales',
  description:
    'Talk to the UpperDeck team about shared AI employees for your organization, with admin controls, PHI redaction, SSO, and enterprise integrations. We scope it in one call.',
  path: '/request-quote',
  keywords: ['enterprise client intelligence', 'organization workspace quote', 'agency software'],
});

export default function RequestQuotePage() {
  return <RequestQuotePageContent />;
}
