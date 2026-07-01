'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { SunnyUpdatesList } from '@/components/updates/SunnyUpdateCard';
import { Button } from '@/components/ui/Button';
import type { DashboardUpdatesFeed } from '@/lib/data/queries';
import {
  dashboardUpdatesFeedChanged,
  fetchDashboardUpdatesFeed,
} from '@/lib/dashboard/updates-feed';
import { portfolioScopeHref, type DashboardPortfolioScope } from '@/lib/projects/portfolio';

const POLL_MS = 2000;

export function DashboardUpdatesPanel({
  portfolioScope,
  limit = 5,
  initialFeed,
}: {
  portfolioScope: DashboardPortfolioScope;
  limit?: number;
  initialFeed: DashboardUpdatesFeed;
}) {
  const router = useRouter();
  const [feed, setFeed] = useState(initialFeed);
  const [indexingActive, setIndexingActive] = useState(initialFeed.indexingActive);
  const feedRef = useRef(feed);

  useEffect(() => {
    feedRef.current = feed;
  }, [feed]);

  useEffect(() => {
    setFeed(initialFeed);
    setIndexingActive(initialFeed.indexingActive);
    feedRef.current = initialFeed;
  }, [portfolioScope, initialFeed]);

  const refreshFeed = useCallback(async () => {
    const next = await fetchDashboardUpdatesFeed(portfolioScope, limit);
    if (!next) return;

    const { hasNewUpdates, indexingFinished } = dashboardUpdatesFeedChanged(feedRef.current, next);

    setFeed(next);
    setIndexingActive(next.indexingActive);

    if (hasNewUpdates || indexingFinished) {
      router.refresh();
    }
  }, [portfolioScope, limit, router]);

  useEffect(() => {
    function onUploaded() {
      setIndexingActive(true);
      void refreshFeed();
    }

    window.addEventListener('project-files-uploaded', onUploaded);
    return () => window.removeEventListener('project-files-uploaded', onUploaded);
  }, [refreshFeed]);

  useEffect(() => {
    if (!indexingActive) return;

    void refreshFeed();
    const interval = window.setInterval(() => {
      void refreshFeed();
    }, POLL_MS);

    return () => window.clearInterval(interval);
  }, [indexingActive, refreshFeed]);

  return (
    <div className="mb-5 sm:mb-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Sunny Updates</h2>
          {indexingActive && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
              title="Files are still uploading or indexing"
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              Indexing
            </span>
          )}
        </div>
        <Link href={portfolioScopeHref('/updates', portfolioScope)} className="shrink-0">
          <Button variant="ghost" size="sm">
            View all
          </Button>
        </Link>
      </div>

      {indexingActive && (
        <p className="mb-4 text-sm text-amber-800 dark:text-amber-200">
          Sunny is still reading uploaded files. New updates will appear here when indexing finishes.
        </p>
      )}

      <SunnyUpdatesList
        updates={feed.updates}
        pendingBatches={feed.pendingBatches}
        pendingFiles={feed.pendingFiles}
      />
    </div>
  );
}
