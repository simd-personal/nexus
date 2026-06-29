import Link from 'next/link';
import { UpperDeckLogo } from '@/components/brand/UpperDeckLogo';
import { loginHref } from '@/lib/auth/login-url';
import { APP_DOMAIN } from '@/lib/constants';
import {
  COMPANY_LINKS,
  LEGAL_LINKS,
  PRODUCT_LINKS,
  SOLUTION_LINKS,
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
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <UpperDeckLogo size="sm" theme="dark" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--brand-text-secondary)]">
              Hire Sunny, your first AI employee for client work. Briefs, risks, and follow ups
              from every deck, email, and call. Getting more capable with every release.
            </p>
          </div>
          <FooterColumn title="Product" links={PRODUCT_LINKS} />
          <FooterColumn title="Solutions" links={SOLUTION_LINKS} />
          <div className="space-y-10">
            <FooterColumn title="Company" links={COMPANY_LINKS} />
            <FooterColumn title="Legal" links={LEGAL_LINKS} />
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--brand-border)] pt-8 sm:flex-row">
          <p className="text-sm text-[var(--brand-text-secondary)]">
            © {new Date().getFullYear()} UpperDeck · {APP_DOMAIN}
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link href={loginHref({ mode: 'signup' })} className="marketing-nav-link">
              Get started free
            </Link>
            <Link href="/pricing" className="marketing-nav-link">
              Pricing
            </Link>
            <Link href="/privacy" className="marketing-nav-link">
              Privacy
            </Link>
            <Link href="/terms" className="marketing-nav-link">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
