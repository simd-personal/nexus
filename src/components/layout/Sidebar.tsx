'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  AlertTriangle,
  CheckSquare,
  Search,
  Settings,
  LifeBuoy,
  X,
  type LucideIcon,
} from 'lucide-react';
import { SunnyAvatar } from '@/components/brand/SunnyAvatar';
import { cn } from '@/lib/utils';
import { UpperDeckLogo } from '@/components/brand/UpperDeckLogo';
import { SidebarAccountFooter } from '@/components/layout/SidebarAccountFooter';
import { useThemePreferences } from '@/hooks/useThemePreferences';
import { portfolioScopeFromSearchParams, scopedAppHref } from '@/lib/projects/path-context';
import type { AccountSummary } from '@/lib/account/summary';

const navItems: Array<
  | { href: string; label: string; icon: LucideIcon }
  | { href: string; label: string; sunnyIcon: true }
> = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/updates', label: 'Sunny Updates', sunnyIcon: true },
  { href: '/critical-items', label: 'Critical Items', icon: AlertTriangle },
  { href: '/action-items', label: 'Action Items', icon: CheckSquare },
  { href: '/sunny', label: 'Sunny Chat', sunnyIcon: true },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/support', label: 'Support', icon: LifeBuoy },
];

const CHAT_NAV_HREFS = new Set(['/sunny', '/search']);

function prefetchChatBundle() {
  void import('@/components/chat/SunnyChatInterface');
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  account?: AccountSummary | null;
}

export function Sidebar({ mobileOpen = false, onMobileClose, account = null }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const portfolioScope = portfolioScopeFromSearchParams(searchParams);
  const { darkMode } = useThemePreferences();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-[var(--ud-cloud)] bg-white transition-transform duration-200 ease-in-out dark:border-[var(--brand-border)] dark:bg-[var(--brand-bg-secondary)]',
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
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const href = scopedAppHref(pathname, item.href, { portfolioScope });
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = 'icon' in item ? item.icon : null;
          return (
            <Link
              key={item.href}
              href={href}
              data-tour={
                item.href === '/dashboard'
                  ? 'nav-dashboard'
                  : item.href === '/projects'
                    ? 'nav-projects'
                    : item.href === '/updates'
                      ? 'nav-updates'
                      : item.href === '/sunny'
                        ? 'nav-sunny'
                        : item.href === '/action-items'
                          ? 'nav-action-items'
                          : undefined
              }
              onClick={onMobileClose}
              onMouseEnter={CHAT_NAV_HREFS.has(item.href) ? prefetchChatBundle : undefined}
              onFocus={CHAT_NAV_HREFS.has(item.href) ? prefetchChatBundle : undefined}
              className={cn(
                'app-nav-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'app-nav-active'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
              )}
            >
              {'sunnyIcon' in item ? (
                <SunnyAvatar size="xs" />
              ) : (
                Icon && <Icon className="h-4 w-4 shrink-0" />
              )}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <SidebarAccountFooter account={account} />
    </aside>
  );
}
