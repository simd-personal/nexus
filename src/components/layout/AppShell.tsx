'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { UpperDeckLogo } from '@/components/brand/UpperDeckLogo';
import { useThemePreferences } from '@/hooks/useThemePreferences';

export function AppShell({ children }: { children: React.ReactNode }) {
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
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--ud-stone)]">
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)] lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-[var(--ud-cloud)]"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/dashboard" className="min-w-0 flex-1">
          <UpperDeckLogo size="sm" theme={darkMode ? 'dark' : 'light'} />
        </Link>
      </header>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      )}

      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <main className="min-h-screen min-w-0 pt-14 lg:ml-64 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
