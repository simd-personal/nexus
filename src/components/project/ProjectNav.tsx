'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { href: 'overview', label: 'Overview' },
  { href: 'files', label: 'Files' },
  { href: 'search', label: 'Search' },
  { href: 'ask-sunny', label: 'Ask Sunny' },
  { href: 'deck', label: 'Deck' },
  { href: 'critical-items', label: 'Critical Items' },
  { href: 'timeline', label: 'Timeline' },
  { href: 'playbook', label: 'Playbook' },
  { href: 'follow-up', label: 'Follow Up Email' },
];

export function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const basePath = `/projects/${projectId}`;

  return (
    <div className="border-b border-gray-200 bg-white dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)]">
      <nav className="flex gap-1 overflow-x-auto px-4 sm:px-6">
        {tabs.map((tab) => {
          const href = `${basePath}/${tab.href}`;
          const isActive = pathname === href || (tab.href === 'overview' && pathname === basePath);
          return (
            <Link
              key={tab.href}
              href={href}
              className={cn(
                'whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'border-gray-900 text-gray-900 dark:border-gray-100 dark:text-gray-100'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200'
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
