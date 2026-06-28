import { AI_EMPLOYEE_NAME, APP_NAME, BRAND_TAGLINE } from '@/lib/constants';
import { getSiteUrl } from '@/lib/marketing/seo';

export function OrganizationJsonLd() {
  const siteUrl = getSiteUrl();
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APP_NAME,
    url: siteUrl,
    description: BRAND_TAGLINE,
    logo: `${siteUrl}/upperdeck-icon.svg`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function SoftwareApplicationJsonLd() {
  const siteUrl = getSiteUrl();
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: APP_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: siteUrl,
    description: BRAND_TAGLINE,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free plan with one client project',
    },
    featureList: [
      'Client project command center',
      `${AI_EMPLOYEE_NAME} AI assistant`,
      'Executive briefs and timelines',
      'Critical item detection',
      'Semantic search across client files',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
