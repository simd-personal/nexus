import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MarketingShell } from '@/components/marketing/MarketingShell';

export function MarketingPageLayout({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <MarketingShell>
      <section className="marketing-hero marketing-hero-compact">
        <div className="auth-brand-blob-a" />
        <div className="marketing-container relative z-10 py-14 lg:py-20">
          {eyebrow && <p className="marketing-eyebrow">{eyebrow}</p>}
          <h1 className="marketing-hero-title mt-3 max-w-3xl">{title}</h1>
          <p className="marketing-hero-body mt-4 max-w-2xl">{description}</p>
        </div>
      </section>

      <div className="marketing-seo-content">{children}</div>

      <section className="marketing-section bg-white border-t border-[var(--ud-cloud)]">
        <div className="marketing-container text-center">
          <h2 className="marketing-section-title">Ready to see your whole client picture?</h2>
          <p className="marketing-section-body mx-auto mt-4 max-w-xl">
            Start free in under a minute. No credit card required.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/login" className="marketing-btn-primary marketing-btn-lg group">
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/pricing" className="marketing-btn-secondary marketing-btn-lg">
              View pricing
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
