import { loginHref } from '@/lib/auth/login-url';
import {
  LATEST_MODELS_FEATURE,
  LATEST_MODELS_PRO_FEATURE,
  type PricingFeature,
} from '@/lib/marketing/model-lineup';

export type { PricingFeature };

export type PricingTier = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
  features: PricingFeature[];
};

/** B2C freemium + Pro */
export const B2C_PRICING: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'For freelancers adding an AI employee on a single client.',
    cta: 'Start free',
    ctaHref: loginHref({ mode: 'signup' }),
    features: [
      '1 active client project',
      'Upload meetings, decks, emails & notes',
      'Sunny, your AI employee (25 messages / month)',
      LATEST_MODELS_FEATURE,
      'Basic brief & timeline views',
      'Email signup & password recovery',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$39',
    period: '/ month',
    description: 'For consultants and operators with multiple AI employees worth of client work.',
    cta: 'Upgrade to Pro',
    ctaHref: loginHref({ mode: 'signup', plan: 'pro' }),
    highlighted: true,
    features: [
      'Unlimited client projects',
      'Unlimited Sunny, your AI employee across all projects',
      LATEST_MODELS_PRO_FEATURE,
      'Critical items & follow up detection',
      'Semantic search across all files',
      'Audio transcription & PDF processing',
      'Priority processing & email support',
    ],
  },
  {
    id: 'pro-annual',
    name: 'Pro Annual',
    price: '$348',
    period: '/ year',
    description:
      'Recommended for freelancers on marketplaces like Upwork and Fiverr who run client work as a business.',
    cta: 'Start annual',
    ctaHref: loginHref({ mode: 'signup', plan: 'pro-annual' }),
    features: [
      'Everything in Pro',
      'Early access to integrations that make Sunny more capable',
      { text: 'Multi factor authentication', comingSoon: true },
      'Export & API access (when available)',
    ],
  },
];

/** Sold via quote — rendered alongside B2C tiers but has no online checkout. */
export const ENTERPRISE_TIER: PricingTier = {
  id: 'enterprise',
  name: 'Enterprise',
  price: 'Custom',
  period: 'annual quote',
  description: 'For agencies, consultancies, and regulated teams rolling Sunny out across the organization.',
  cta: 'Request a quote',
  ctaHref: '/request-quote',
  features: [
    'Everything in Pro for every seat',
    'Slack, email & calendar connectors included from day one, with guided setup during onboarding',
    'Multi tenant organization workspace',
    'Admin roles & access request approvals',
    'PHI redaction for healthcare uploads',
    'SSO / SAML (on request)',
    { text: 'Multi factor authentication', comingSoon: true },
    'Dedicated support & SLA options',
  ],
};

export function pricingButtonClass(tier: PricingTier): string {
  if (tier.id === 'pro-annual') return 'marketing-btn-gold';
  if (tier.highlighted) return 'marketing-btn-primary';
  return 'marketing-btn-secondary';
}

export const B2B_CAPABILITIES = [
  'Multi tenant organization workspace',
  'Admin roles & access request approvals',
  'Organization scoped projects & audit trail',
  'PHI redaction for healthcare uploads',
  'SSO / SAML (on request)',
  'Slack, email & calendar connectors included from day one',
  'Custom onboarding & security review',
  'Dedicated support & SLA options',
] as const;
