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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';
import { UpperDeckLogo } from '@/components/brand/UpperDeckLogo';
import { signOut } from '@/lib/actions/projects';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/updates', label: 'Sunny Updates', icon: Sun },
  { href: '/critical-items', label: 'Critical Items', icon: AlertTriangle },
  { href: '/sunny', label: 'Sunny Chat', icon: Sun },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-[var(--ud-cloud)] bg-white">
      <div className="border-b border-[var(--ud-mist)] p-6">
        <Link href="/dashboard" className="block">
          <UpperDeckLogo size="sm" theme="light" />
          <p className="mt-1.5 text-xs text-[var(--ud-slate)]">Command Center</p>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <Sun className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{AI_EMPLOYEE_NAME}</p>
            <p className="text-xs text-gray-500">AI Employee</p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
