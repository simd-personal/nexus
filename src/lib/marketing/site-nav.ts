import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/constants';

export type SiteNavLink = {
  href: string;
  label: string;
  description?: string;
};

export const PRODUCT_LINKS: SiteNavLink[] = [
  {
    href: '/product',
    label: 'Product',
    description: 'Onboard Sunny, the AI employee built for client facing delivery',
  },
  {
    href: '/client-intelligence',
    label: 'Client intelligence',
    description: 'Briefs, risks, and follow ups in one place',
  },
  {
    href: '/integrations',
    label: 'Integrations',
    description: 'Email, Slack, Drive, CRM, and more',
  },
  {
    href: '/pricing',
    label: 'Pricing',
    description: 'Free, Pro, and enterprise plans',
  },
];

export const SOLUTION_LINKS: SiteNavLink[] = [
  {
    href: '/for-consultants',
    label: 'For consultants',
    description: 'Solo operators managing multiple clients',
  },
  {
    href: '/for-freelancers',
    label: 'For freelancers',
    description: 'Keep every gig and client organized',
  },
  {
    href: '/for-agencies',
    label: 'For agencies',
    description: 'Shared context across delivery teams',
  },
  {
    href: '/request-quote',
    label: 'Organizations',
    description: 'Enterprise tenants, SSO, and PHI options',
  },
];

export const COMPANY_LINKS: SiteNavLink[] = [
  { href: '/about', label: 'About' },
  { href: '/request-quote', label: 'Contact sales' },
];

export const SUPPORT_LINKS: SiteNavLink[] = [
  { href: SUPPORT_MAILTO, label: 'Contact support', description: SUPPORT_EMAIL },
];

export const LEGAL_LINKS: SiteNavLink[] = [
  { href: '/terms', label: 'Terms of service' },
  { href: '/privacy', label: 'Privacy policy' },
  { href: '/data-policy', label: 'Data policy' },
  { href: '/acceptable-use', label: 'Acceptable use policy' },
  { href: '/refund-policy', label: 'Return & refund policy' },
];

export const PRIMARY_NAV_LINKS: SiteNavLink[] = [
  { href: '/product', label: 'Product' },
  { href: '/integrations', label: 'Integrations' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/request-quote', label: 'Organizations' },
];
