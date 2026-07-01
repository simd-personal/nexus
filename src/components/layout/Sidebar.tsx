'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  AlertTriangle,
  CheckSquare,
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

type NavItem =
  | { href: string; label: string; icon: LucideIcon; tour?: string }
  | { href: string; label: string; sunnyIcon: true; tour?: string };

type NavGroup = { label?: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tour: 'nav-dashboard' },
      { href: '/sunny', label: 'Ask Sunny', sunnyIcon: true, tour: 'nav-sunny' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { href: '/projects', label: 'Projects', icon: FolderKanban, tour: 'nav-projects' },
      { href: '/updates', label: 'Sunny Updates', sunnyIcon: true, tour: 'nav-updates' },
    ],
  },
  {
    label: 'Needs attention',
    items: [
      { href: '/critical-items', label: 'Critical Items', icon: AlertTriangle },
      { href: '/action-items', label: 'Action Items', icon: CheckSquare, tour: 'nav-action-items' },
    ],
  },
];

const footerNavItems: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/support', label: 'Support', icon: LifeBuoy },
];

const CHAT_NAV_HREFS = new Set(['/sunny']);

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

  const renderLink = (item: NavItem) => {
    const href = scopedAppHref(pathname, item.href, { portfolioScope });
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const Icon = 'icon' in item ? item.icon : null;
    return (
      <Link
        key={item.href}
        href={href}
        data-tour={item.tour}
        onClick={onMobileClose}
        onMouseEnter={CHAT_NAV_HREFS.has(item.href) ? prefetchChatBundle : undefined}
        onFocus={CHAT_NAV_HREFS.has(item.href) ? prefetchChatBundle : undefined}
        className={cn(
          'app-nav-link flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors',
          isActive && 'app-nav-active'
        )}
      >
        {'sunnyIcon' in item ? (
          <SunnyAvatar size="xs" />
        ) : (
          Icon && <Icon className="app-nav-icon h-[18px] w-[18px] shrink-0 text-[var(--app-text-subtle)]" />
        )}
        {item.label}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        'app-sidebar fixed left-0 top-0 z-50 flex h-screen w-60 flex-col border-r transition-transform duration-200 ease-in-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0'
      )}
    >
      <div className="app-sidebar-brand relative flex h-14 items-center border-b px-4">
        <button
          type="button"
          onClick={onMobileClose}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--app-text-muted)] hover:bg-[var(--app-hover)] lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
        <Link href="/dashboard" className="block" onClick={onMobileClose}>
          <UpperDeckLogo size="sm" theme={darkMode ? 'dark' : 'light'} />
        </Link>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {navGroups.map((group, idx) => (
          <div key={group.label ?? `group-${idx}`} className="space-y-0.5">
            {group.label && <p className="app-nav-section-label">{group.label}</p>}
            {group.items.map(renderLink)}
          </div>
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-[var(--app-border-faint)] px-3 py-3">
        {footerNavItems.map(renderLink)}
      </div>

      <SidebarAccountFooter account={account} />
    </aside>
  );
}
