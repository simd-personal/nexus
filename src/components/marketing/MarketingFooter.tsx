import Link from 'next/link';
import { UpperDeckLogo } from '@/components/brand/UpperDeckLogo';
import { APP_DOMAIN, APP_NAME, BRAND_TAGLINE, PARENT_COMPANY_LEGAL_NAME } from '@/lib/constants';
import {
  COMPANY_LINKS,
  LEGAL_LINKS,
  PRODUCT_LINKS,
  SOLUTION_LINKS,
  SUPPORT_LINKS,
} from '@/lib/marketing/site-nav';

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string; description?: string }[];
}) {
  return (
    <div>
      <p className="marketing-footer-heading">{title}</p>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={`${title}-${link.href}`}>
            <Link href={link.href} className="marketing-footer-link block">
              {link.label}
            </Link>
            {link.description && (
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--brand-text-secondary)]">
                {link.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="marketing-container py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <UpperDeckLogo size="sm" theme="dark" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--brand-text-secondary)]">
              {BRAND_TAGLINE} Briefs, risks, and follow ups from every deck, email, and call.
            </p>
          </div>
          <FooterColumn title="Product" links={PRODUCT_LINKS} />
          <FooterColumn title="Solutions" links={SOLUTION_LINKS} />
          <div className="space-y-10">
            <FooterColumn title="Company" links={COMPANY_LINKS} />
            <FooterColumn title="Support" links={SUPPORT_LINKS} />
          </div>
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        <div className="mt-12 border-t border-[var(--brand-border)] pt-8 text-center">
          <p className="text-sm text-[var(--brand-text-secondary)]">
            © {new Date().getFullYear()} {APP_NAME}, a subsidiary of {PARENT_COMPANY_LEGAL_NAME} ·{' '}
            {APP_DOMAIN}
          </p>
          <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <li key={`legal-${link.href}`}>
                <Link href={link.href} className="marketing-footer-link text-xs">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
