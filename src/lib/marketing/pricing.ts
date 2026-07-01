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
    description: 'Save 25% when you commit for the year.',
    cta: 'Start annual',
    ctaHref: loginHref({ mode: 'signup', plan: 'pro-annual' }),
    features: [
      'Everything in Pro',
      '2 months free vs monthly',
      'Early access to integrations that make Sunny more capable',
      'Export & API access (when available)',
    ],
  },
];

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
  'Slack, email & calendar connectors',
  'Custom onboarding & security review',
  'Dedicated support & SLA options',
] as const;
