import Link from 'next/link';
import { UpperDeckLogo } from '@/components/brand/UpperDeckLogo';

const links = [
  { href: '#product', label: 'Product' },
  { href: '#integrations', label: 'Integrations' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#organizations', label: 'Organizations' },
];

export function MarketingNav() {
  return (
    <header className="marketing-nav">
      <div className="marketing-container flex items-center justify-between gap-6 py-5">
        <Link href="/" className="shrink-0">
          <UpperDeckLogo size="md" theme="light" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="marketing-nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="marketing-btn-ghost hidden sm:inline-flex">
            Sign in
          </Link>
          <Link href="/login" className="marketing-btn-primary">
            Get started free
          </Link>
        </div>
      </div>
    </header>
  );
}
