import Link from 'next/link';
import { UpperDeckLogo } from '@/components/brand/UpperDeckLogo';
import { loginHref } from '@/lib/auth/login-url';
import { PRIMARY_NAV_LINKS } from '@/lib/marketing/site-nav';

export function MarketingNav() {
  return (
    <header className="marketing-nav">
      <div className="marketing-container flex items-center gap-2 py-4 sm:gap-6 sm:py-5">
        <Link href="/" className="min-w-0 shrink">
          <UpperDeckLogo size="sm" theme="light" className="sm:hidden" />
          <UpperDeckLogo size="md" theme="light" className="hidden sm:flex" />
        </Link>

        <nav className="hidden items-center gap-8 md:ml-4 md:flex lg:ml-8" aria-label="Main">
          {PRIMARY_NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="marketing-nav-link">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
          <Link href={loginHref()} className="marketing-btn-ghost marketing-nav-signin whitespace-nowrap">
            Sign in
          </Link>
          <Link href={loginHref({ mode: 'signup' })} className="marketing-btn-primary whitespace-nowrap">
            Get started free
          </Link>
        </div>
      </div>
    </header>
  );
}
