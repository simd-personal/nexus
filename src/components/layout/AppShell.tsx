'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { Sidebar } from './Sidebar';
import { UpperDeckLogo } from '@/components/brand/UpperDeckLogo';
import { useThemePreferences } from '@/hooks/useThemePreferences';
import { ProductTourProvider } from '@/components/tour/ProductTourProvider';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import type { AccountSummary } from '@/lib/account/summary';

export function AppShell({
  children,
  account = null,
}: {
  children: React.ReactNode;
  account?: AccountSummary | null;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { darkMode } = useThemePreferences();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = () => {
      if (mediaQuery.matches) setMobileOpen(false);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <ProductTourProvider>
    <div className="flex min-h-[100dvh] flex-col bg-[var(--app-canvas)]">
      <header className="fixed inset-x-0 top-0 z-40 flex min-h-14 items-center gap-3 border-b border-[var(--app-border)] bg-[var(--app-sidebar)] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--app-text-muted)] hover:bg-[var(--app-hover)]"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/dashboard" className="min-w-0 flex-1">
          <UpperDeckLogo size="sm" theme={darkMode ? 'dark' : 'light'} />
        </Link>
        <SignOutButton variant="icon" />
      </header>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      )}

      <Suspense fallback={null}>
        <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} account={account} />
      </Suspense>

      <main className="app-main flex min-h-0 flex-1 flex-col pt-[calc(3.5rem+env(safe-area-inset-top,0px))] pb-[max(0px,env(safe-area-inset-bottom,0px))] lg:ml-64 lg:pt-0 lg:pb-0">
        {children}
      </main>

      <InstallPrompt />
      <ServiceWorkerRegister />
    </div>
    </ProductTourProvider>
  );
}
