'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Briefcase, Check } from 'lucide-react';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { Reveal } from '@/components/marketing/fun/Reveal';
import { submitOrganizationQuoteRequest } from '@/lib/actions/quote';
import { loginHref } from '@/lib/auth/login-url';
import { APP_NAME } from '@/lib/constants';
import { B2B_CAPABILITIES } from '@/lib/marketing/pricing';

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="auth-label">{label}</label>
      {children}
    </div>
  );
}

export function RequestQuoteForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await submitOrganizationQuoteRequest(formData);

    if (result.error) {
      setMessage(result.error);
    } else {
      setIsSuccess(true);
      setMessage(result.message ?? 'Request submitted.');
      e.currentTarget.reset();
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Full name">
        <input name="full_name" type="text" required className="auth-input" />
      </FormField>

      <FormField label="Work email">
        <input name="email" type="email" required autoComplete="email" className="auth-input" />
      </FormField>

      <FormField label="Company">
        <input name="company_name" type="text" required className="auth-input" />
      </FormField>

      <FormField label="Industry">
        <select name="industry" defaultValue="other" className="auth-input">
          <option value="software">Software company</option>
          <option value="healthcare">Healthcare</option>
          <option value="other">Other</option>
        </select>
      </FormField>

      <FormField label="Team size (optional)">
        <input
          name="team_size"
          type="text"
          placeholder="e.g. 25 consultants, 3 departments"
          className="auth-input"
        />
      </FormField>

      <FormField label="What are you trying to solve? (optional)">
        <textarea
          name="message"
          rows={4}
          placeholder="Multi tenant access, PHI safeguards, admin controls, etc."
          className="auth-input min-h-[7rem] resize-y"
        />
      </FormField>

      {message && (
        <p
          className={`auth-alert ${isSuccess ? 'auth-alert-success' : 'auth-alert-error'}`}
          role="status"
        >
          {message}
        </p>
      )}

      <button type="submit" disabled={loading} className="auth-submit">
        {loading ? 'Submitting…' : 'Request a quote'}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}

export function RequestQuotePageContent() {
  return (
    <MarketingShell>
      <section className="marketing-hero fun-hero marketing-hero-compact">
        <div className="fun-mesh" aria-hidden />
        <div className="auth-brand-blob-a" />
        <div className="auth-brand-blob-b" />
        <div className="marketing-container relative z-10 py-14 lg:py-20">
          <Reveal>
            <p className="marketing-hero-eyebrow">Organizations</p>
            <h1 className="marketing-hero-title fun-hero-title mt-3 max-w-3xl">
              Request a quote for your team
            </h1>
            <p className="marketing-hero-body mt-4 max-w-2xl">
              Tell us about your organization. We&apos;ll follow up with pricing, security details,
              and a tailored rollout plan. Organization accounts are sold by quote, not free online
              signup.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="marketing-section bg-white">
        <div className="marketing-container grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal className="min-w-0">
            <div className="marketing-org-banner fun-lift">
              <div className="flex items-center gap-3">
                <div className="marketing-feature-icon fun-icon-pop">
                  <Briefcase className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <p className="font-semibold text-[var(--ud-graphite)]">{APP_NAME} Enterprise</p>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-[var(--ud-slate)]">
                Shared tenants, admin roles, access approvals, and healthcare PHI safeguards, built
                for software companies, consultancies, and regulated industries.
              </p>
              <ul className="mt-6 space-y-3">
                {B2B_CAPABILITIES.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[var(--ud-slate)]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-accent)]" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-[var(--ud-slate)]">
                Typical response within 1 business day · 10 to 500+ seats · Custom SSO available
              </p>
            </div>
          </Reveal>

          <Reveal delay={120} className="min-w-0">
            <div className="auth-glass-form fun-lift p-5 sm:p-8">
              <h2 className="auth-form-title">Tell us about your team</h2>
              <p className="auth-form-subtitle">
                We&apos;ll reach out with pricing and setup options.
              </p>
              <div className="mt-6">
                <RequestQuoteForm />
              </div>
              <p className="mt-6 text-center text-sm text-[var(--ud-slate)]">
                Just need a personal workspace?{' '}
                <Link href={loginHref({ mode: 'signup' })} className="auth-link">
                  Sign up free
                </Link>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="marketing-section fun-cta">
        <div className="fun-cta-glow" aria-hidden />
        <div className="marketing-container relative z-10 text-center">
          <Reveal>
            <h2 className="marketing-section-title">Ready to see your whole client picture?</h2>
            <p className="marketing-section-body mx-auto mt-4 max-w-xl">
              Start free in under a minute. No credit card required.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href={loginHref({ mode: 'signup' })}
                className="marketing-btn-primary marketing-btn-lg fun-btn-glow group w-full sm:w-auto"
              >
                Get started free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/pricing" className="marketing-btn-secondary marketing-btn-lg w-full sm:w-auto">
                View pricing
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </MarketingShell>
  );
}
