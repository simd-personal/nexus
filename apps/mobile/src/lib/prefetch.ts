import type { QueryClient } from '@tanstack/react-query';
import {
  fetchCriticalItems,
  fetchDashboardStats,
  fetchDashboardUpdates,
  fetchProjects,
} from '@/lib/api';

export async function prefetchDashboard(client: QueryClient) {
  await Promise.all([
    client.prefetchQuery({ queryKey: ['dashboard-stats'], queryFn: fetchDashboardStats }),
    client.prefetchQuery({ queryKey: ['dashboard-updates'], queryFn: () => fetchDashboardUpdates(5) }),
    client.prefetchQuery({ queryKey: ['home-critical'], queryFn: () => fetchCriticalItems(3) }),
    client.prefetchQuery({ queryKey: ['projects'], queryFn: fetchProjects }),
    client.prefetchQuery({ queryKey: ['critical-items'], queryFn: () => fetchCriticalItems() }),
  ]);
}
