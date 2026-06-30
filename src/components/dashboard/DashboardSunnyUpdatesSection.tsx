'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SunnyUpdatesList } from '@/components/updates/SunnyUpdateCard';
import type { DashboardUpdatesFeed } from '@/lib/data/queries';
import {
  dashboardUpdatesFeedChanged,
  fetchDashboardUpdatesFeed,
} from '@/lib/dashboard/updates-feed';
import type { DashboardPortfolioScope } from '@/lib/projects/portfolio';

const POLL_MS = 2000;

export function DashboardSunnyUpdatesSection({
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

  return <SunnyUpdatesList updates={feed.updates} pendingBatches={feed.pendingBatches} />;
}
