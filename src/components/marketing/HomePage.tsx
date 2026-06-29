import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { AnnouncementBar } from '@/components/marketing/fun/AnnouncementBar';
import { HeroTransform } from '@/components/marketing/fun/HeroTransform';
import { LogoMarquee } from '@/components/marketing/fun/LogoMarquee';
import { Reveal } from '@/components/marketing/fun/Reveal';
import { Testimonials } from '@/components/marketing/fun/Testimonials';
import { AI_EMPLOYEE_NAME, BRAND_TAGLINE } from '@/lib/constants';
import { loginHref } from '@/lib/auth/login-url';
import { HOME_WOW_POINTS, HOME_WORKFLOW_STEPS } from '@/lib/marketing/homepage';
import { B2C_PRICING } from '@/lib/marketing/pricing';

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="marketing-eyebrow">{children}</p>;
}

function SectionTitle({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h2 className={`marketing-section-title ${className}`}>{children}</h2>;
}

export function HomePage() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="marketing-hero fun-hero">
        <div className="fun-mesh" aria-hidden />
        <div className="auth-brand-blob-a" />
        <div className="auth-brand-blob-b" />
        <div className="marketing-container relative z-10 grid items-center gap-10 py-10 sm:gap-12 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div className="marketing-fade-up min-w-0">
            <AnnouncementBar />
            <p className="marketing-hero-eyebrow mt-6">{BRAND_TAGLINE}</p>
            <h1 className="marketing-hero-title fun-hero-title">
              Stop reading the pile.{' '}
              <span className="fun-gradient-text">Hire {AI_EMPLOYEE_NAME}.</span>
            </h1>
            <p className="marketing-hero-body">
              {AI_EMPLOYEE_NAME} is your first AI employee for client work. Drop in decks, emails,
              meetings, and notes. Walk into every call prepared.
            </p>

            <ul className="marketing-hero-highlights" aria-label="Key benefits">
              {HOME_WOW_POINTS.map((point) => (
                <li key={point.title}>
                  <p className="marketing-hero-highlight-title">{point.title}</p>
                  <p className="marketing-hero-highlight-body">{point.body}</p>
                </li>
              ))}
            </ul>

            <div className="marketing-hero-actions mt-8">
              <Link href={loginHref({ mode: 'signup' })} className="marketing-btn-primary marketing-btn-lg fun-btn-glow group">
                Get started free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/pricing" className="marketing-btn-secondary marketing-btn-lg">
                See pricing
              </Link>
            </div>

            <div className="fun-hero-meta mt-6">
              <span className="fun-hero-meta-dot" aria-hidden />
              <span className="fun-hero-meta-items">
                <span>No credit card</span>
                <span>Cancel anytime</span>
              </span>
            </div>
          </div>

          <div className="marketing-hero-visual-wrap">
            <HeroTransform />
          </div>
        </div>

        <div className="marketing-container relative z-10 pb-12">
          <p className="fun-marquee-label">Works with the files you already have</p>
          <LogoMarquee />
        </div>
      </section>

      {/* How it works */}
      <section id="product" className="marketing-section marketing-section-gradient">
        <div className="marketing-container">
          <Reveal>
            <SectionEyebrow>How it works</SectionEyebrow>
            <SectionTitle className="mt-3">Three steps to a prepared you</SectionTitle>
            <p className="marketing-section-body mt-4 max-w-2xl">
              Onboard {AI_EMPLOYEE_NAME} on a client in minutes. Upload once. Your AI employee
              handles the reading so you walk into every call ready.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {HOME_WORKFLOW_STEPS.map(({ step, title, body }, i) => (
              <Reveal key={step} delay={i * 90}>
                <div className="marketing-feature-card fun-lift h-full">
                  <div className="flex items-center justify-between">
                    <div className="marketing-feature-icon fun-icon-pop">
                      {step === '01' && <Upload className="h-5 w-5" strokeWidth={1.75} />}
                      {step === '02' && <Sparkles className="h-5 w-5" strokeWidth={1.75} />}
                      {step === '03' && <Zap className="h-5 w-5" strokeWidth={1.75} />}
                    </div>
                    <span className="fun-step-num">{step}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-[var(--ud-graphite)]">{title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[var(--ud-slate)]">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <p className="mt-10 text-sm">
            <Link href="/product" className="marketing-inline-link">
              Explore the full product →
            </Link>
          </p>
        </div>
      </section>

      {/* Sunny chat */}
      <section className="marketing-section bg-white">
        <div className="marketing-container grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <Reveal className="min-w-0">
            <SectionEyebrow>See it in action</SectionEyebrow>
            <SectionTitle className="mt-3">Ask {AI_EMPLOYEE_NAME} anything about the project</SectionTitle>
            <p className="marketing-section-body mt-4">
              {AI_EMPLOYEE_NAME} has read every meeting, email, deck, and note in the project.
              Every answer links back to your files.
            </p>
          </Reveal>
          <Reveal delay={120} className="min-w-0">
            <div className="auth-glass-form min-w-0 p-5 sm:p-8 fun-lift">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--ud-slate)]">
                {AI_EMPLOYEE_NAME} · Project chat
              </p>
              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-[var(--ud-mist)] px-4 py-3 text-sm text-[var(--ud-graphite)]">
                  What did the client say about the timeline in last week&apos;s call?
                </div>
                <div className="rounded-xl border border-[var(--ud-cloud)] bg-white px-4 py-3 text-sm leading-relaxed text-[var(--ud-slate)]">
                  In the March 12 sync, the client asked to pull launch to Q3 citing budget review
                  (Meeting transcript, p.4). The deck from March 10 still shows Q2. That&apos;s a
                  contradiction worth flagging.
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Testimonials */}
      <section className="marketing-section marketing-section-gradient">
        <div className="marketing-container">
          <Reveal>
            <SectionEyebrow>From our users</SectionEyebrow>
            <SectionTitle className="mt-3">People stopped dreading prep</SectionTitle>
          </Reveal>
          <Reveal className="mt-12" delay={80}>
            <Testimonials />
          </Reveal>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="marketing-section bg-white">
        <div className="marketing-container">
          <Reveal>
            <SectionEyebrow>Pricing</SectionEyebrow>
            <SectionTitle className="mt-3">Hire free. Upgrade at client number two.</SectionTitle>
            <p className="marketing-section-body mt-4 max-w-2xl">
              Try your first AI employee on one client at no cost. Pro unlocks unlimited projects
              and unlimited {AI_EMPLOYEE_NAME}, latest models included.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {B2C_PRICING.map((tier, i) => (
              <Reveal key={tier.id} delay={i * 90}>
                <div
                  className={
                    tier.highlighted
                      ? 'marketing-pricing-card marketing-pricing-featured fun-lift h-full'
                      : 'marketing-pricing-card fun-lift h-full'
                  }
                >
                  {tier.highlighted && <p className="marketing-pricing-badge">Most popular</p>}
                  <h3 className="text-lg font-semibold text-[var(--ud-graphite)]">{tier.name}</h3>
                  <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                    <span className="text-4xl font-semibold text-[var(--ud-graphite)]">
                      {tier.price}
                    </span>
                    <span className="text-sm text-[var(--ud-slate)]">{tier.period}</span>
                  </div>
                  <p className="mt-3 text-sm text-[var(--ud-slate)]">{tier.description}</p>
                  <ul className="mt-6 space-y-3">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--ud-slate)]">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7c6cf0]" strokeWidth={2.5} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={tier.ctaHref}
                    className={
                      tier.highlighted
                        ? 'marketing-btn-primary mt-8 w-full justify-center'
                        : 'marketing-btn-secondary mt-8 w-full justify-center'
                    }
                  >
                    {tier.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-[var(--ud-slate)]">
            Free plan needs no credit card. Paid plans cancel the same day with no refunds.{' '}
            <Link href="/pricing" className="marketing-inline-link">
              Full pricing details
            </Link>
          </p>

          <Reveal className="mt-14">
            <div className="marketing-org-banner">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[#7c6cf0]">
                    For teams and organizations
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--ud-graphite)]">
                    Need admin controls, PHI safeguards, or multi tenant access?
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--ud-slate)]">
                    Organization accounts are sold by quote. Tell us about your team and we will
                    follow up with pricing, security details, and a rollout plan.
                  </p>
                </div>
                <Link href="/request-quote" className="marketing-btn-primary shrink-0 justify-center lg:px-8">
                  Request more information
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="marketing-section fun-cta">
        <div className="fun-cta-glow" aria-hidden />
        <div className="marketing-container relative z-10 text-center">
          <Reveal>
            <h2 className="marketing-section-title">Hire your first AI employee today</h2>
            <p className="marketing-section-body mx-auto mt-4 max-w-xl">
              Start free. {AI_EMPLOYEE_NAME} is included and gets more capable with every release.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link href={loginHref({ mode: 'signup' })} className="marketing-btn-primary marketing-btn-lg fun-btn-glow group w-full sm:w-auto">
                Get started free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/request-quote" className="marketing-btn-secondary marketing-btn-lg w-full sm:w-auto">
                Request organization info
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </MarketingShell>
  );
}
