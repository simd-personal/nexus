'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalSearchBarProps {
  className?: string;
  projectId?: string;
  placeholder?: string;
}

export function GlobalSearchBar({
  className,
  projectId,
  placeholder = 'Ask anything: meetings, decks, people, risks, decisions…',
}: GlobalSearchBarProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    const params = new URLSearchParams({ q: query });
    if (projectId) params.set('project', projectId);
    router.push(`/search?${params.toString()}`);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSearch} className={cn('relative', className)}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent shadow-sm"
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
