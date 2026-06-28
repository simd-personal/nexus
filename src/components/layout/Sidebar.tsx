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
  LogOut,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';
import { UpperDeckLogo } from '@/components/brand/UpperDeckLogo';
import { signOut } from '@/lib/actions/projects';
import { useThemePreferences } from '@/hooks/useThemePreferences';

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
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-100 text-gray-900 dark:bg-[var(--ud-cloud)] dark:text-gray-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-[var(--ud-cloud)] dark:hover:text-gray-100'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-4 dark:border-[var(--ud-cloud)]">
        <div className="mb-2 flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <Sun className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{AI_EMPLOYEE_NAME}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">AI Employee</p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-[var(--ud-cloud)] dark:hover:text-gray-100"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
