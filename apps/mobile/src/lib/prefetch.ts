import type { QueryClient } from '@tanstack/react-query';
import {
  fetchCriticalItems,
  fetchDashboardStats,
  fetchDashboardUpdates,
  fetchOpenActionItems,
  fetchAllProjects,
} from '@/lib/api';

export type PrefetchStep = {
  id: string;
  label: string;
  run: (client: QueryClient) => Promise<unknown>;
};

export const DASHBOARD_PREFETCH_STEPS: PrefetchStep[] = [
  {
    id: 'stats',
    label: 'Tallying dashboard stats…',
    run: (client) =>
      client.prefetchQuery({ queryKey: ['dashboard-stats'], queryFn: () => fetchDashboardStats() }),
  },
  {
    id: 'updates',
    label: 'Fetching Sunny updates…',
    run: (client) =>
      client.prefetchQuery({ queryKey: ['dashboard-updates'], queryFn: () => fetchDashboardUpdates(5) }),
  },
  {
    id: 'home-critical',
    label: 'Scanning critical items…',
    run: (client) =>
      client.prefetchQuery({ queryKey: ['home-critical'], queryFn: () => fetchCriticalItems(3) }),
  },
  {
    id: 'home-actions',
    label: 'Loading action items…',
    run: (client) =>
      client.prefetchQuery({
        queryKey: ['home-action-items', 5],
        queryFn: () => fetchOpenActionItems(5),
      }),
  },
  {
    id: 'projects',
    label: 'Loading your projects…',
    run: (client) =>
      client.prefetchQuery({ queryKey: ['projects', 'all'], queryFn: fetchAllProjects }),
  },
  {
    id: 'critical',
    label: 'Indexing critical items…',
    run: (client) =>
      client.prefetchQuery({ queryKey: ['critical-items'], queryFn: () => fetchCriticalItems() }),
  },
];

export type PrefetchProgressHandler = (
  completed: number,
  total: number,
  step: PrefetchStep
) => void;

export async function prefetchDashboard(
  client: QueryClient,
  onProgress?: PrefetchProgressHandler
) {
  const total = DASHBOARD_PREFETCH_STEPS.length;

  for (let index = 0; index < total; index += 1) {
    const step = DASHBOARD_PREFETCH_STEPS[index];
    onProgress?.(index, total, step);
    await step.run(client);
  }

  onProgress?.(total, total, DASHBOARD_PREFETCH_STEPS[total - 1]!);
}
