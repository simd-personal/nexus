import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CriticalItemRow } from '@/components/lists';
import { RefreshableScroll, SectionHeader } from '@/components/RefreshableScroll';
import { TabScreenHeader } from '@/components/BrandHeader';
import { HeaderActions, HeaderIconButton } from '@/components/ScreenHeader';
import { DashboardSkeleton } from '@/components/Skeleton';
import { SunnyUpdatePreviewCard } from '@/components/SunnyUpdateCard';
import { EmptyState, Screen, StatPill } from '@/components/ui';
import { fetchCriticalItems, fetchDashboardStats, fetchDashboardUpdates } from '@/lib/api';
import { spacing } from '@/theme/colors';

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const statsQuery = useQuery({ queryKey: ['dashboard-stats'], queryFn: fetchDashboardStats });
  const updatesQuery = useQuery({ queryKey: ['dashboard-updates'], queryFn: () => fetchDashboardUpdates(5) });
  const criticalQuery = useQuery({ queryKey: ['home-critical'], queryFn: () => fetchCriticalItems(3) });

  const isInitialLoading =
    (statsQuery.isLoading && !statsQuery.data) ||
    (updatesQuery.isLoading && !updatesQuery.data) ||
    (criticalQuery.isLoading && !criticalQuery.data);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([statsQuery.refetch(), updatesQuery.refetch(), criticalQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [statsQuery, updatesQuery, criticalQuery]);

  const stats = statsQuery.data?.stats;
  const updates = updatesQuery.data?.updates ?? [];
  const criticalItems = criticalQuery.data?.items ?? [];

  return (
    <Screen>
      <RefreshableScroll
        refreshing={refreshing}
        onRefresh={refreshAll}
        header={
          <TabScreenHeader
            tagline="Command Center"
            compactBrand={false}
            title="Executive Dashboard"
            subtitle="What Sunny flagged and what changed recently."
            rightAction={
              <HeaderActions>
                <HeaderIconButton
                  label="Settings"
                  icon="settings-sharp"
                  onPress={() => router.push('/settings')}
                />
              </HeaderActions>
            }
          />
        }
      >
        {isInitialLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatPill label="Critical" value={stats?.criticalCount ?? 0} tone="danger" />
              <StatPill label="Updates" value={stats?.newUpdatesCount ?? 0} tone="accent" />
              <StatPill label="Actions" value={stats?.actionItemsCount ?? 0} tone="neutral" />
              <StatPill label="Conflicts" value={stats?.conflictsCount ?? 0} tone="neutral" />
            </View>

            <SectionHeader title="Sunny updates" count={updates.length || undefined} />
            {updates.length === 0 ? (
              <EmptyState
                title="No recent updates"
                body="Upload project materials and Sunny will surface changes here."
              />
            ) : (
              updates.map((update) => (
                <SunnyUpdatePreviewCard
                  key={update.id}
                  update={update}
                  onPress={() => router.push(`/update/${update.id}`)}
                />
              ))
            )}

            <SectionHeader title="Top critical items" count={criticalItems.length || undefined} />
            {criticalItems.length === 0 ? (
              <EmptyState title="All clear" body="No open critical items in your portfolio." />
            ) : (
              criticalItems.map((item) => <CriticalItemRow key={item.id} item={item} />)
            )}
          </>
        )}

        {statsQuery.isError ? (
          <Text style={styles.error}>Could not refresh dashboard. Pull down to try again.</Text>
        ) : null}
      </RefreshableScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.sm,
  },
  error: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: '#EF4444',
    fontSize: 14,
  },
});
