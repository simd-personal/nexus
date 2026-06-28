'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { href: 'overview', label: 'Overview' },
  { href: 'files', label: 'Files' },
  { href: 'search', label: 'Search' },
  { href: 'brief', label: 'Sunny Brief' },
  { href: 'deck', label: 'Deck' },
  { href: 'critical-items', label: 'Critical Items' },
  { href: 'timeline', label: 'Timeline' },
  { href: 'ask-sunny', label: 'Ask Sunny' },
  { href: 'playbook', label: 'Playbook' },
  { href: 'follow-up', label: 'Follow Up Email' },
];

export function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const basePath = `/projects/${projectId}`;

  return (
    <div className="border-b border-gray-200 bg-white">
      <nav className="flex gap-1 px-6 overflow-x-auto">
        {tabs.map((tab) => {
          const href = `${basePath}/${tab.href}`;
          const isActive = pathname === href || (tab.href === 'overview' && pathname === basePath);
          return (
            <Link
              key={tab.href}
              href={href}
              className={cn(
                'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                isActive
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
