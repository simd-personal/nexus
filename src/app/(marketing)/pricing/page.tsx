import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { MarketingPageLayout } from '@/components/marketing/MarketingPageLayout';
import { LegalPolicyLinks } from '@/components/marketing/LegalPolicyLinks';
import { B2B_CAPABILITIES, B2C_PRICING, pricingButtonClass } from '@/lib/marketing/pricing';
import { createMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = createMarketingMetadata({
  title: 'Pricing',
  description:
    'UpperDeck pricing: start free on one client project, upgrade to Pro for unlimited Sunny, or request an enterprise quote for organizations.',
  path: '/pricing',
  keywords: [
    'AI employee pricing',
    'consultant software pricing',
    'UpperDeck Pro',
    'freemium AI employee',
  ],
});

export default function PricingPage() {
  return (
    <MarketingPageLayout
      eyebrow="Pricing"
      title="Start free. Upgrade when you add clients."
      description="Prove value on one client for free, then upgrade when you are managing multiple engagements. Sunny gets more capable as we ship new features."
      showSignupCta={false}
    >
      <section className="marketing-section bg-white">
        <div className="marketing-container">
          <div className="grid gap-6 lg:grid-cols-3">
            {B2C_PRICING.map((tier) => (
              <div
                key={tier.id}
                className={
                  tier.highlighted ? 'marketing-pricing-card marketing-pricing-featured' : 'marketing-pricing-card'
                }
              >
                {tier.highlighted && <span className="marketing-pricing-badge">Most popular</span>}
                <h2 className="text-lg font-semibold text-[var(--ud-graphite)]">{tier.name}</h2>
                <p className="mt-2 text-sm marketing-text">{tier.description}</p>
                <p className="mt-6">
                  <span className="text-4xl font-semibold tracking-tight text-[var(--ud-graphite)]">
                    {tier.price}
                  </span>
                  <span className="text-sm marketing-text">{tier.period}</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm marketing-text">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-accent)]" strokeWidth={2.5} />
                      {feature}
                    </li>
                  ))}
                </ul>
                {tier.id !== 'free' && (
                <Link
                  href={tier.ctaHref}
                  className={`mt-8 inline-flex w-full items-center justify-center gap-2 ${pricingButtonClass(tier)}`}
                >
                  <span>{tier.cta}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                )}
              </div>
            ))}
          </div>

          <LegalPolicyLinks className="mt-8 text-center text-xs marketing-text" />
        </div>
      </section>

      <section className="marketing-section marketing-section-dark">
        <div className="marketing-container">
          <h2 className="marketing-section-title !text-white">Organizations & enterprise</h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/65">
            Multi tenant workspaces for agencies, consultancies, and regulated industries. Sold via
            quote, not online checkout.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {B2B_CAPABILITIES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/75">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#a78bfa]" strokeWidth={2.5} />
                {item}
              </li>
            ))}
          </ul>
          <Link href="/request-quote" className="marketing-btn-primary marketing-btn-lg mt-10 inline-flex">
            Request a quote
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </MarketingPageLayout>
  );
}
