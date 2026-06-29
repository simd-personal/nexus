import Link from 'next/link';
import { UpperDeckLogo } from '@/components/brand/UpperDeckLogo';
import { loginHref } from '@/lib/auth/login-url';
import { PRIMARY_NAV_LINKS } from '@/lib/marketing/site-nav';

export function MarketingNav() {
  return (
    <header className="marketing-nav">
      <div className="marketing-container flex items-center justify-between gap-6 py-5">
        <Link href="/" className="shrink-0">
          <UpperDeckLogo size="md" theme="light" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {PRIMARY_NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="marketing-nav-link">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href={loginHref()} className="marketing-btn-ghost hidden sm:inline-flex">
            Sign in
          </Link>
          <Link href={loginHref({ mode: 'signup' })} className="marketing-btn-primary">
            Get started free
          </Link>
        </div>
      </div>
    </header>
  );
}
