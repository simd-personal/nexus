import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  Check,
  Cpu,
  FileText,
  Layers,
  MessageSquare,
  Radar,
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { LegalPolicyLinks } from '@/components/marketing/LegalPolicyLinks';
import { AnnouncementBar } from '@/components/marketing/fun/AnnouncementBar';
import { AudienceTabs } from '@/components/marketing/fun/AudienceTabs';
import { HeroTransform } from '@/components/marketing/fun/HeroTransform';
import { LogoMarquee } from '@/components/marketing/fun/LogoMarquee';
import { Reveal } from '@/components/marketing/fun/Reveal';
import { SpeedShowcase } from '@/components/marketing/fun/SpeedShowcase';
import { Testimonials } from '@/components/marketing/fun/Testimonials';
import { AI_EMPLOYEE_NAME, BRAND_TAGLINE } from '@/lib/constants';
import { INTEGRATIONS, INTEGRATION_STATUS_LABEL } from '@/lib/marketing/integrations';
import { HOME_AI_POINTS, HOME_COMPARISONS, HOME_WORKFLOW_STEPS } from '@/lib/marketing/homepage';
import { B2B_CAPABILITIES, B2C_PRICING } from '@/lib/marketing/pricing';
import { AI_EMPLOYEE_GROWTH_LINE } from '@/lib/marketing/voice';

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
              {AI_EMPLOYEE_NAME}
              {'\u00a0'}is your first AI employee for client work. Drop in decks, emails, meetings,
              and notes. Get briefs, risks, and follow ups with every line cited back to the source.
              Latest GPT and Claude models included. No second subscription needed.
            </p>

            <div className="marketing-hero-actions mt-8">
              <Link href="/login" className="marketing-btn-primary marketing-btn-lg fun-btn-glow group">
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
                <span>Latest GPT &amp; Claude models</span>
                <span>Cancel anytime</span>
              </span>
            </div>

            <LegalPolicyLinks
              className="mt-4 text-xs text-[var(--ud-slate)]"
              linkClassName="marketing-inline-link text-xs"
            />
          </div>

          <div className="marketing-hero-visual-wrap">
            <HeroTransform />
          </div>
        </div>

        {/* Source marquee */}
        <div className="marketing-container relative z-10 pb-12">
          <p className="fun-marquee-label">Feeds on the messy stuff you already have</p>
          <LogoMarquee />
        </div>
      </section>

      {/* Who it's for — interactive tabs */}
      <section className="marketing-section bg-white">
        <div className="marketing-container">
          <Reveal>
            <SectionEyebrow>Who it&apos;s for</SectionEyebrow>
            <SectionTitle className="mt-3">Built for anyone who lives in client work</SectionTitle>
            <p className="marketing-section-body mt-4 max-w-2xl">
              Not a task manager, CRM, or chat tab. UpperDeck is where you hire an AI employee who
              knows each client project cold, and gets sharper as we ship.
            </p>
          </Reveal>
          <Reveal className="mt-12" delay={80}>
            <AudienceTabs />
          </Reveal>
          <p className="mt-10 text-sm">
            <Link href="/for-consultants" className="marketing-inline-link">
              See how consultants use UpperDeck →
            </Link>
          </p>
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

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: FileText, label: 'Executive briefs' },
              { icon: Radar, label: 'Critical item detection' },
              { icon: MessageSquare, label: `Ask ${AI_EMPLOYEE_NAME} anything` },
              { icon: Layers, label: 'Deck & playbook generation' },
            ].map(({ icon: Icon, label }, i) => (
              <Reveal key={label} delay={i * 70}>
                <div className="marketing-pill-card fun-lift">
                  <Icon className="h-4 w-4 text-[#7c6cf0]" strokeWidth={1.75} />
                  <span>{label}</span>
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

      {/* Speed showcase */}
      <section className="marketing-section bg-white">
        <div className="marketing-container">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal className="min-w-0">
              <SectionEyebrow>Fast where it counts</SectionEyebrow>
              <SectionTitle className="mt-3">
                A whole afternoon of reading, <span className="fun-gradient-text">done before your coffee</span>
              </SectionTitle>
              <p className="marketing-section-body mt-4">
                {AI_EMPLOYEE_NAME} reads the entire project, every deck, thread, and transcript,
                and hands you the brief while you&apos;re still finding the meeting link.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <div className="fun-panel">
                <SpeedShowcase />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Sunny chat */}
      <section className="marketing-section marketing-section-gradient">
        <div className="marketing-container grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <Reveal className="min-w-0">
            <SectionEyebrow>AI employee</SectionEyebrow>
            <SectionTitle className="mt-3">Meet {AI_EMPLOYEE_NAME}, who actually did the reading</SectionTitle>
            <p className="marketing-section-body mt-4">
              Not a blank ChatGPT window. {AI_EMPLOYEE_NAME} has read every meeting, email, deck, and
              note in the project. Ask what changed, what is at risk, or what to say tomorrow. Every
              answer links back to your files.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                'Thinks in projects, not one off prompts',
                'Cites your uploads, not invented client facts',
                'Briefs, timelines, and follow ups on demand',
                'Gets more capable as UpperDeck ships features',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] text-[var(--ud-slate)]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7c6cf0]" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
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

      {/* Always improving */}
      <section className="marketing-section bg-white">
        <div className="marketing-container grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <Reveal className="min-w-0">
            <SectionEyebrow>Always improving</SectionEyebrow>
            <SectionTitle className="mt-3">An AI employee that gets more powerful over time</SectionTitle>
            <p className="marketing-section-body mt-4">
              You are hiring {AI_EMPLOYEE_NAME}, not buying a static tool. UpperDeck routes your work
              to the latest GPT and Claude models today, and we keep adding integrations, connectors,
              and skills with every release.
            </p>
            <ul className="mt-8 space-y-3">
              {HOME_AI_POINTS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] text-[var(--ud-slate)]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7c6cf0]" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <div className="marketing-seo-callout fun-lift">
              <div className="flex items-center gap-3">
                <div className="marketing-feature-icon fun-icon-pop">
                  <Cpu className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <p className="font-semibold text-[var(--ud-graphite)]">What you skip</p>
              </div>
              <ul className="mt-5 space-y-3 text-sm leading-relaxed text-[var(--ud-slate)]">
                <li>Hiring ChatGPT Plus and Claude Pro on the side</li>
                <li>Copy-pasting context into a blank chat every time</li>
                <li>Wondering whether the AI invented something about your client</li>
                <li>Rebuilding the same workflows in a tool that never improves</li>
              </ul>
              <p className="mt-6 text-sm text-[var(--ud-slate)]">{AI_EMPLOYEE_GROWTH_LINE}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Testimonials */}
      <section className="marketing-section marketing-section-gradient">
        <div className="marketing-container">
          <Reveal>
            <SectionEyebrow>Love letters</SectionEyebrow>
            <SectionTitle className="mt-3">People stopped dreading prep</SectionTitle>
            <p className="marketing-section-body mt-4 max-w-2xl">
              Consultants and operators who traded chat tab chaos for an AI employee that shows up
              prepared.
            </p>
          </Reveal>
          <Reveal className="mt-12" delay={80}>
            <Testimonials />
          </Reveal>
        </div>
      </section>

      {/* Positioning */}
      <section className="marketing-section bg-white">
        <div className="marketing-container">
          <Reveal>
            <SectionEyebrow>Why UpperDeck</SectionEyebrow>
            <SectionTitle className="mt-3">Your AI employee vs. another software category</SectionTitle>
            <p className="marketing-section-body mt-4 max-w-2xl">
              Most tools store tasks or notes. UpperDeck gives you an AI employee focused on{' '}
              <em className="not-italic font-medium text-[var(--ud-graphite)]">client intelligence</em>:
              what changed, what conflicts, and what to do before the next conversation.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {HOME_COMPARISONS.map((item, i) => (
              <Reveal key={item.label} delay={i * 90}>
                <div className="marketing-compare-card fun-lift h-full">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#7c6cf0]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm text-[var(--ud-slate)]">{item.examples}</p>
                  <p className="mt-4 text-[15px] leading-relaxed text-[var(--ud-graphite)]">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-10 text-sm">
            <Link href="/client-intelligence" className="marketing-inline-link">
              What is client intelligence? →
            </Link>
          </p>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="marketing-section bg-white">
        <div className="marketing-container">
          <Reveal>
            <SectionEyebrow>Integrations</SectionEyebrow>
            <SectionTitle className="mt-3">Connect the tools your clients already live in</SectionTitle>
            <p className="marketing-section-body mt-4 max-w-2xl">
              Start by uploading files today. Email, Slack, calendar, and CRM connectors are on the
              roadmap. Each one makes your AI employee smarter about every client project.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INTEGRATIONS.map((item, i) => (
              <Reveal key={item.name} delay={(i % 3) * 70}>
                <div className="marketing-integration-card fun-lift h-full">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wider text-[var(--ud-slate)]">
                        {item.category}
                      </p>
                      <h3 className="mt-1 font-semibold text-[var(--ud-graphite)]">{item.name}</h3>
                    </div>
                    <span className={`marketing-status-badge marketing-status-${item.status}`}>
                      {INTEGRATION_STATUS_LABEL[item.status]}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--ud-slate)]">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-10 text-sm">
            <Link href="/integrations" className="marketing-inline-link">
              View all integrations →
            </Link>
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="marketing-section marketing-section-gradient">
        <div className="marketing-container">
          <Reveal>
            <SectionEyebrow>Pricing</SectionEyebrow>
            <SectionTitle className="mt-3">Hire free. Upgrade at client number two.</SectionTitle>
            <p className="marketing-section-body mt-4 max-w-2xl">
              Try your first AI employee on one client at no cost. Managing multiple engagements? Pro
              unlocks unlimited projects and unlimited {AI_EMPLOYEE_NAME}, latest models included.
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

          <LegalPolicyLinks className="mt-3 text-center text-xs text-[var(--ud-slate)]" />

          <Reveal className="mt-14">
            <div className="marketing-org-banner">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[#7c6cf0]">
                    For teams &amp; organizations
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--ud-graphite)]">
                    Need admin controls, PHI safeguards, or multi tenant access?
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--ud-slate)]">
                    Organization accounts are sold by quote, not online checkout. Tell us about your
                    team and we&apos;ll follow up with pricing, security details, and a tailored
                    rollout plan.
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

      {/* Organizations / Enterprise */}
      <section id="organizations" className="marketing-section marketing-section-dark">
        <div className="marketing-container">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <Reveal>
              <SectionEyebrow>Organizations</SectionEyebrow>
              <SectionTitle className="mt-3 !text-white">
                Built for teams that can&apos;t afford blind spots
              </SectionTitle>
              <p className="mt-4 text-[17px] leading-relaxed text-white/60">
                UpperDeck Enterprise gives software companies, consultancies, and healthcare
                organizations a shared workspace with the admin controls, access governance, and
                compliance safeguards that personal accounts don&apos;t include.
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-white/50">
                Request more information and our team will reach out to discuss your team size,
                integration needs (Slack, email, CRM), security requirements, and custom pricing.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/request-quote"
                  className="marketing-btn-primary marketing-btn-lg inline-flex w-full justify-center sm:w-auto"
                >
                  Request more information
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#organizations-form"
                  className="marketing-btn-secondary marketing-btn-lg inline-flex w-full justify-center !border-white/20 !bg-white/10 !text-white hover:!bg-white/15 sm:w-auto"
                >
                  See what we cover
                </a>
              </div>

              <p className="mt-5 text-sm text-white/40">
                Typical response within 1 business day · 10 to 500+ seats · Custom SSO available
              </p>
            </Reveal>

            <Reveal delay={120} className="min-w-0">
              <div id="organizations-form" className="auth-glass-card-dark min-w-0 p-5 sm:p-8">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-[#c4b5fd]" strokeWidth={1.75} />
                  <p className="font-semibold text-white">What&apos;s included in Enterprise</p>
                </div>
                <ul className="mt-6 space-y-3">
                  {B2B_CAPABILITIES.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-white/75">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#a78bfa]" strokeWidth={2.5} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/request-quote" className="marketing-btn-primary mt-8 w-full justify-center">
                  Request a quote
                </Link>
              </div>
            </Reveal>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: 'Software & agencies',
                body: 'Multi-client delivery teams that need shared intelligence and admin oversight.',
              },
              {
                title: 'Healthcare',
                body: 'PHI redaction, access approvals, and audit trails for regulated client work.',
              },
              {
                title: 'Consultancies',
                body: 'Partner-led firms scaling client context across principals and engagement teams.',
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <div className="marketing-org-card h-full">
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="marketing-section fun-cta">
        <div className="fun-cta-glow" aria-hidden />
        <div className="marketing-container relative z-10 text-center">
          <Reveal>
            <h2 className="marketing-section-title">Hire your first AI employee today</h2>
            <p className="marketing-section-body mx-auto mt-4 max-w-xl">
              Join consultants and operators who stopped juggling chat tabs and inboxes. Start free.{' '}
              {AI_EMPLOYEE_NAME} is included and getting more capable all the time.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link href="/login" className="marketing-btn-primary marketing-btn-lg fun-btn-glow group w-full sm:w-auto">
                Get started free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/request-quote" className="marketing-btn-secondary marketing-btn-lg w-full sm:w-auto">
                Request organization info
              </Link>
            </div>
            <LegalPolicyLinks className="mt-6 text-xs text-[var(--ud-slate)]" />
          </Reveal>
        </div>
      </section>
    </MarketingShell>
  );
}
