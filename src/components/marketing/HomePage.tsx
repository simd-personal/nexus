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
  Shield,
  Sparkles,
  Upload,
  Users,
  Zap,
} from 'lucide-react';
import { UpperDeckLogo } from '@/components/brand/UpperDeckLogo';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import {
  AI_EMPLOYEE_NAME,
  BRAND_TAGLINE,
} from '@/lib/constants';
import { INTEGRATIONS, INTEGRATION_STATUS_LABEL } from '@/lib/marketing/integrations';
import {
  HOME_AI_POINTS,
  HOME_AUDIENCES,
  HOME_COMPARISONS,
  HOME_WORKFLOW_STEPS,
} from '@/lib/marketing/homepage';
import { B2B_CAPABILITIES, B2C_PRICING } from '@/lib/marketing/pricing';

function HeroStatCard({
  label,
  value,
  sub,
  dark = false,
}: {
  label: string;
  value: string;
  sub: string;
  dark?: boolean;
}) {
  return (
    <div className={dark ? 'marketing-hero-stat marketing-hero-stat-dark' : 'marketing-hero-stat'}>
      <p className="marketing-hero-stat-label">{label}</p>
      <p className="marketing-hero-stat-value">{value}</p>
      <p className="marketing-hero-stat-sub">{sub}</p>
    </div>
  );
}

function HeroDashboard() {
  return (
    <div className="marketing-hero-dashboard" aria-hidden>
      <div className="marketing-hero-dashboard-ribbon" />
      <div className="marketing-hero-dashboard-inner">
        <div className="marketing-hero-stats">
          <HeroStatCard label="Projects" value="24" sub="Active clients" dark />
          <HeroStatCard label="Decks" value="18" sub="Updated this week" />
          <HeroStatCard label="Emails" value="36" sub="Synced this week" />
          <HeroStatCard label="Decisions" value="9" sub="Waiting on you" dark />
        </div>
        <div className="marketing-hero-activity">
          <p className="marketing-hero-activity-label">Recent activity</p>
          <ul className="marketing-hero-activity-list">
            <li>Client Q2 Strategy Deck · Updated 2h ago</li>
            <li>Homepage Redesign Brief · Updated 5h ago</li>
            <li>Follow-up email draft · Sunny suggested 1h ago</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

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
      <section className="marketing-hero">
        <div className="auth-brand-blob-a" />
        <div className="auth-brand-blob-b" />
        <div className="marketing-container relative z-10 grid items-center gap-10 py-10 sm:gap-12 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div className="marketing-fade-up min-w-0">
            <p className="marketing-hero-eyebrow">{BRAND_TAGLINE}</p>
            <h1 className="marketing-hero-title">
              Walk into every client call knowing what changed.
            </h1>
            <p className="marketing-hero-body">
              UpperDeck is your client intelligence command center. Upload decks, emails, meetings,
              and notes — {AI_EMPLOYEE_NAME} reads everything and surfaces briefs, risks, and
              follow-ups with sources cited. No juggling ChatGPT, Claude, and your inbox.
            </p>

            <div className="marketing-hero-actions mt-8">
              <Link href="/login" className="marketing-btn-primary marketing-btn-lg group">
                Get started free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/pricing" className="marketing-btn-secondary marketing-btn-lg">
                See pricing
              </Link>
            </div>

            <ul className="marketing-hero-trust mt-8 sm:mt-10">
              <li className="marketing-hero-trust-item">
                <span className="marketing-hero-trust-icon">
                  <Check className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                No credit card to start
              </li>
              <li className="marketing-hero-trust-item">
                <span className="marketing-hero-trust-icon">
                  <Cpu className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                GPT &amp; Claude included — no extra AI bill
              </li>
              <li className="marketing-hero-trust-item">
                <span className="marketing-hero-trust-icon">
                  <Users className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                Built for consultants &amp; operators
              </li>
              <li className="marketing-hero-trust-item">
                <span className="marketing-hero-trust-icon">
                  <Shield className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                Enterprise security available
              </li>
            </ul>
          </div>

          <div className="marketing-hero-visual-wrap">
            <HeroDashboard />
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="marketing-section bg-white">
        <div className="marketing-container">
          <SectionEyebrow>Who it&apos;s for</SectionEyebrow>
          <SectionTitle className="mt-3">
            Client intelligence for people who live in decks, emails, and calls
          </SectionTitle>
          <p className="marketing-section-body mt-4 max-w-2xl">
            UpperDeck is not a task manager or a CRM. It is the layer between your client files and
            your next decision — built for anyone who reconstructs context before every meeting.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {HOME_AUDIENCES.map((item) => (
              <div key={item.title} className="marketing-feature-card">
                <h3 className="text-lg font-semibold text-[var(--ud-graphite)]">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--ud-slate)]">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-sm">
            <Link href="/for-consultants" className="marketing-inline-link">
              See how consultants use UpperDeck →
            </Link>
          </p>
        </div>
      </section>

      {/* Product */}
      <section id="product" className="marketing-section marketing-section-gradient">
        <div className="marketing-container">
          <SectionEyebrow>How it works</SectionEyebrow>
          <SectionTitle className="mt-3">From messy files to a clear brief in minutes</SectionTitle>
          <p className="marketing-section-body mt-4 max-w-2xl">
            Upload your client materials once. {AI_EMPLOYEE_NAME} does the reading — you get the
            signal before your next call, usually in under ten minutes on a new project.
          </p>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {HOME_WORKFLOW_STEPS.map(({ step, title, body }) => (
              <div key={step} className="marketing-feature-card">
                <div className="flex items-center justify-between">
                  <div className="marketing-feature-icon">
                    {step === '01' && <Upload className="h-5 w-5" strokeWidth={1.75} />}
                    {step === '02' && <Sparkles className="h-5 w-5" strokeWidth={1.75} />}
                    {step === '03' && <Zap className="h-5 w-5" strokeWidth={1.75} />}
                  </div>
                  <span className="text-sm font-medium text-[var(--ud-cloud)]">{step}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[var(--ud-graphite)]">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--ud-slate)]">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: FileText, label: 'Executive briefs' },
              { icon: Radar, label: 'Critical item detection' },
              { icon: MessageSquare, label: `Ask ${AI_EMPLOYEE_NAME} anything` },
              { icon: Layers, label: 'Deck & playbook generation' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="marketing-pill-card">
                <Icon className="h-4 w-4 text-[#7c6cf0]" strokeWidth={1.75} />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <p className="mt-10 text-sm">
            <Link href="/product" className="marketing-inline-link">
              Explore the full product →
            </Link>
          </p>
        </div>
      </section>

      {/* Sunny */}
      <section className="marketing-section bg-white">
        <div className="marketing-container grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="min-w-0">
            <SectionEyebrow>AI employee</SectionEyebrow>
            <SectionTitle className="mt-3">
              Meet {AI_EMPLOYEE_NAME} — with full context on your client work
            </SectionTitle>
            <p className="marketing-section-body mt-4">
              {AI_EMPLOYEE_NAME} is not a generic chatbot. It is an AI teammate that has read every
              meeting, email, deck, and note in the project. Ask what changed, what is at risk, or
              what to say on tomorrow&apos;s call — every answer links back to your files.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                'Answers cite your uploads — not invented client facts',
                'Briefs, timelines, and follow-ups on demand',
                'Flags contradictions and risks before they become fires',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] text-[var(--ud-slate)]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7c6cf0]" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="auth-glass-form min-w-0 p-5 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--ud-slate)]">
              Sunny · Project chat
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-xl bg-[var(--ud-mist)] px-4 py-3 text-sm text-[var(--ud-graphite)]">
                What did the client say about the timeline in last week&apos;s call?
              </div>
              <div className="rounded-xl border border-[var(--ud-cloud)] bg-white px-4 py-3 text-sm leading-relaxed text-[var(--ud-slate)]">
                In the March 12 sync, the client asked to pull launch to Q3 citing budget review
                (Meeting transcript, p.4). The deck from March 10 still shows Q2 — that&apos;s a
                contradiction worth flagging.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI models included */}
      <section className="marketing-section marketing-section-gradient">
        <div className="marketing-container grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="min-w-0">
            <SectionEyebrow>AI included</SectionEyebrow>
            <SectionTitle className="mt-3">
              Latest GPT and Claude models — one platform, no extra subscriptions
            </SectionTitle>
            <p className="marketing-section-body mt-4">
              You should not need ChatGPT Plus, Claude Pro, and a folder of client files. UpperDeck
              routes your work to leading models from OpenAI and Anthropic behind the scenes — briefs,
              search, decks, and chat are all included in your plan.
            </p>
            <ul className="mt-8 space-y-3">
              {HOME_AI_POINTS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] text-[var(--ud-slate)]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7c6cf0]" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="marketing-seo-callout">
            <div className="flex items-center gap-3">
              <div className="marketing-feature-icon">
                <Cpu className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <p className="font-semibold text-[var(--ud-graphite)]">What you skip</p>
            </div>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-[var(--ud-slate)]">
              <li>Copy-pasting context into a blank chat window</li>
              <li>Paying $20/mo for ChatGPT Plus on top of your tools</li>
              <li>Paying separately for Claude when you need long documents</li>
              <li>Wondering whether the AI made something up about your client</li>
            </ul>
            <p className="mt-6 text-sm text-[var(--ud-slate)]">
              On Pro, AI is unlimited across projects. On Free, you get 25 {AI_EMPLOYEE_NAME}{' '}
              messages a month to prove the value on one client.
            </p>
          </div>
        </div>
      </section>

      {/* Positioning */}
      <section className="marketing-section bg-white">
        <div className="marketing-container">
          <SectionEyebrow>Why UpperDeck</SectionEyebrow>
          <SectionTitle className="mt-3">Not another tool category — a client command center</SectionTitle>
          <p className="marketing-section-body mt-4 max-w-2xl">
            Most software organizes tasks or stores notes. UpperDeck organizes{' '}
            <em className="not-italic font-medium text-[var(--ud-graphite)]">client intelligence</em>
            — what changed, what conflicts, and what you should do before the next conversation.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {HOME_COMPARISONS.map((item) => (
              <div key={item.label} className="marketing-compare-card">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7c6cf0]">
                  {item.label}
                </p>
                <p className="mt-1 text-sm text-[var(--ud-slate)]">{item.examples}</p>
                <p className="mt-4 text-[15px] leading-relaxed text-[var(--ud-graphite)]">
                  {item.body}
                </p>
              </div>
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
          <SectionEyebrow>Integrations</SectionEyebrow>
          <SectionTitle className="mt-3">Connect the tools your clients already live in</SectionTitle>
          <p className="marketing-section-body mt-4 max-w-2xl">
            Start by uploading files today. Email, Slack, calendar, and CRM connectors are on the
            roadmap — everything feeds the same client command center.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INTEGRATIONS.map((item) => (
              <div key={item.name} className="marketing-integration-card">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--ud-slate)]">
                      {item.category}
                    </p>
                    <h3 className="mt-1 font-semibold text-[var(--ud-graphite)]">{item.name}</h3>
                  </div>
                  <span
                    className={`marketing-status-badge marketing-status-${item.status}`}
                  >
                    {INTEGRATION_STATUS_LABEL[item.status]}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[var(--ud-slate)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-sm">
            <Link href="/integrations" className="marketing-inline-link">
              View all integrations →
            </Link>
          </p>
        </div>
      </section>
      <section id="pricing" className="marketing-section">
        <div className="marketing-container">
          <SectionEyebrow>Pricing</SectionEyebrow>
          <SectionTitle className="mt-3">Start free. Upgrade when you add client number two.</SectionTitle>
          <p className="marketing-section-body mt-4 max-w-2xl">
            Try UpperDeck on one client engagement at no cost. When you are managing multiple
            clients, Pro unlocks unlimited projects and unlimited {AI_EMPLOYEE_NAME} — including
            the latest AI models, with no separate ChatGPT or Claude bill.
          </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {B2C_PRICING.map((tier) => (
              <div
                key={tier.id}
                className={
                  tier.highlighted ? 'marketing-pricing-card marketing-pricing-featured' : 'marketing-pricing-card'
                }
              >
                {tier.highlighted && (
                  <p className="marketing-pricing-badge">Most popular</p>
                )}
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
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-[var(--ud-slate)]">
            Free plan needs no credit card. Cancel Pro anytime.{' '}
            <Link href="/pricing" className="marketing-inline-link">
              Full pricing details
            </Link>
          </p>

          <div className="marketing-org-banner mt-14">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[#7c6cf0]">
                  For teams & organizations
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[var(--ud-graphite)]">
                  Need admin controls, PHI safeguards, or multi-tenant access?
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--ud-slate)]">
                  Organization accounts are not self-serve. Tell us about your team and we&apos;ll
                  follow up with pricing, security details, and a tailored rollout plan.
                </p>
              </div>
              <Link
                href="/request-quote"
                className="marketing-btn-primary shrink-0 justify-center lg:px-8"
              >
                Request more information
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Organizations / Enterprise */}
      <section id="organizations" className="marketing-section marketing-section-dark">
        <div className="marketing-container">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <div>
              <SectionEyebrow>Organizations</SectionEyebrow>
              <SectionTitle className="mt-3 !text-white">
                Built for teams that can&apos;t afford blind spots
              </SectionTitle>
              <p className="mt-4 text-[17px] leading-relaxed text-white/60">
                UpperDeck Enterprise gives software companies, consultancies, and healthcare
                organizations a shared command deck — with the admin controls, access governance,
                and compliance safeguards that personal accounts don&apos;t include.
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
                Typical response within 1 business day · 10–500+ seats · Custom SSO available
              </p>
            </div>

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
              <Link
                href="/request-quote"
                className="marketing-btn-primary mt-8 w-full justify-center"
              >
                Request a quote
              </Link>
            </div>
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
            ].map((item) => (
              <div key={item.title} className="marketing-org-card">
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="marketing-section bg-white">
        <div className="marketing-container text-center">
          <h2 className="marketing-section-title">Stop reconstructing context before every call</h2>
          <p className="marketing-section-body mx-auto mt-4 max-w-xl">
            Join consultants and operators who keep every client in one command center. Start free —
            GPT, Claude, and {AI_EMPLOYEE_NAME} included.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link href="/login" className="marketing-btn-primary marketing-btn-lg group w-full sm:w-auto">
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/request-quote" className="marketing-btn-secondary marketing-btn-lg w-full sm:w-auto">
              Request organization info
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
