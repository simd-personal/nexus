'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { projectIdFromPathname } from '@/lib/projects/path-context';
import type { DashboardPortfolioScope } from '@/lib/projects/portfolio';
import { buildGlobalSearchHref } from '@/lib/search/navigation';
import { cn } from '@/lib/utils';

interface GlobalSearchBarProps {
  className?: string;
  projectId?: string;
  portfolioScope?: DashboardPortfolioScope;
  placeholder?: string;
}

export function GlobalSearchBar({
  className,
  projectId: projectIdProp,
  portfolioScope,
  placeholder = 'Search your materials: meetings, decks, people, risks, decisions…',
}: GlobalSearchBarProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const projectId = projectIdProp ?? projectIdFromPathname(pathname);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const href = buildGlobalSearchHref(query, {
      projectId,
      portfolio: projectId ? undefined : portfolioScope,
    });
    if (!href) return;

    setLoading(true);
    router.push(href);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSearch} className={cn('relative', className)}>
      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[var(--ud-cloud)] bg-white py-3 pl-12 pr-4 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[var(--brand-accent)] focus:outline-none focus:ring-2 focus:ring-[rgba(37,99,235,0.15)] dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-[var(--brand-accent)] dark:focus:ring-[rgba(37,99,235,0.25)]"
      />
      {loading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}
    </form>
  );
}
