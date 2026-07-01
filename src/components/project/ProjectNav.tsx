'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sparkles, ClipboardList } from 'lucide-react';
import { isProjectSectionVisible, type ProjectNavVisibility } from '@upperdeck/shared/project-nav';
import { cn } from '@/lib/utils';

const tabs = [
  { href: 'overview', label: 'Overview', shortLabel: 'Overview' },
  { href: 'files', label: 'Files', shortLabel: 'Files' },
  { href: 'ask-sunny', label: 'Ask Sunny', shortLabel: 'Ask Sunny', ai: true },
  { href: 'deck', label: 'Deck', shortLabel: 'Deck' },
  { href: 'critical-items', label: 'Critical Items', shortLabel: 'Critical' },
  { href: 'timeline', label: 'Timeline', shortLabel: 'Timeline' },
  { href: 'playbook', label: 'Playbook', shortLabel: 'Playbook', coach: true },
  { href: 'follow-up', label: 'Follow Up Email', shortLabel: 'Follow Up' },
];

export function ProjectNav({
  projectId,
  visibility,
}: {
  projectId: string;
  visibility: ProjectNavVisibility;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const basePath = `/projects/${projectId}`;
  const visibleTabs = tabs.filter((tab) => isProjectSectionVisible(tab.href, visibility));

  useEffect(() => {
    function onProjectUpdated() {
      router.refresh();
    }

    window.addEventListener('project-files-uploaded', onProjectUpdated);
    return () => window.removeEventListener('project-files-uploaded', onProjectUpdated);
  }, [router]);

  return (
    <div className="border-b border-gray-200 bg-white dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)]">
      <nav className="project-nav-scroll flex gap-1 overflow-x-auto px-4 sm:px-6">
        {visibleTabs.map((tab) => {
          const href = `${basePath}/${tab.href}`;
          const isActive = pathname === href || (tab.href === 'overview' && pathname === basePath);
          return (
            <Link
              key={tab.href}
              href={href}
              className={cn(
                'whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors sm:px-4',
                isActive
                  ? 'border-gray-900 text-gray-900 dark:border-gray-100 dark:text-gray-100'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200'
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                {'coach' in tab && tab.coach ? (
                  <ClipboardList
                    className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-300"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                ) : 'ai' in tab && tab.ai ? (
                  <Sparkles
                    className="sunny-sparkle h-3.5 w-3.5 shrink-0 text-[var(--brand-accent)]"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                ) : null}
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
