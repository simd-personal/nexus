export type SiteNavLink = {
  href: string;
  label: string;
  description?: string;
};

export const PRODUCT_LINKS: SiteNavLink[] = [
  {
    href: '/product',
    label: 'Product',
    description: 'Hire Sunny, your first AI employee for client work',
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
  { href: '/login', label: 'Sign in' },
  { href: '/request-quote', label: 'Contact sales' },
];

export const LEGAL_LINKS: SiteNavLink[] = [
  { href: '/privacy', label: 'Privacy policy' },
  { href: '/terms', label: 'Terms of service' },
];

export const PRIMARY_NAV_LINKS: SiteNavLink[] = [
  { href: '/product', label: 'Product' },
  { href: '/integrations', label: 'Integrations' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/request-quote', label: 'Organizations' },
];
