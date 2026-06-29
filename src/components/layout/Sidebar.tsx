'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Sun,
  AlertTriangle,
  Search,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UpperDeckLogo } from '@/components/brand/UpperDeckLogo';
import { SidebarAccountFooter } from '@/components/layout/SidebarAccountFooter';
import { useThemePreferences } from '@/hooks/useThemePreferences';
import { scopedAppHref } from '@/lib/projects/path-context';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/updates', label: 'Sunny Updates', icon: Sun },
  { href: '/critical-items', label: 'Critical Items', icon: AlertTriangle },
  { href: '/sunny', label: 'Sunny Chat', icon: Sun },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { darkMode } = useThemePreferences();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-[var(--ud-cloud)] bg-white transition-transform duration-200 ease-in-out dark:bg-[var(--ud-mist)]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0'
      )}
    >
      <div className="relative border-b border-[var(--ud-mist)] p-6">
        <button
          type="button"
          onClick={onMobileClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[var(--ud-cloud)] lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
        <Link href="/dashboard" className="block" onClick={onMobileClose}>
          <UpperDeckLogo size="sm" theme={darkMode ? 'dark' : 'light'} />
          <p className="mt-1.5 text-xs text-[var(--ud-slate)]">Command Center</p>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const href = scopedAppHref(pathname, item.href);
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={href}
              onClick={onMobileClose}
              className={cn(
                'app-nav-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'app-nav-active'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <SidebarAccountFooter />
    </aside>
  );
}
