import { RequestQuotePageContent } from '@/components/enterprise/RequestQuoteForm';
import { createMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = createMarketingMetadata({
  title: 'Request a quote',
  description:
    'Request an UpperDeck organization quote — shared AI employees for delivery teams, with admin controls, PHI redaction, SSO, and enterprise integrations.',
  path: '/request-quote',
  keywords: ['enterprise client intelligence', 'organization workspace quote', 'agency software'],
});

export default function RequestQuotePage() {
  return <RequestQuotePageContent />;
}
