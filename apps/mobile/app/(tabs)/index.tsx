import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionItemRow, CriticalItemRow } from '@/components/lists';
import { PortfolioScopeBar } from '@/components/PortfolioScopeBar';
import { RefreshableScroll, SectionHeader } from '@/components/RefreshableScroll';
import { TabScreenHeader } from '@/components/BrandHeader';
import { HeaderActions, HeaderIconButton } from '@/components/ScreenHeader';
import { DashboardSkeleton } from '@/components/Skeleton';
import { SunnyUpdatePreviewCard } from '@/components/SunnyUpdateCard';
import { EmptyState, Screen, StatPill } from '@/components/ui';
import {
  fetchCriticalItems,
  fetchDashboardPortfolioPreference,
  fetchDashboardStats,
  fetchDashboardUpdates,
  fetchOpenActionItems,
  updateActionItemStatus,
  updateDashboardPortfolioPreference,
} from '@/lib/api';
import type { DashboardPortfolioScope } from '@/lib/types';
import { spacing } from '@/theme/colors';

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const [scope, setScope] = useState<DashboardPortfolioScope>('work');

  const portfolioQuery = useQuery({
    queryKey: ['dashboard-portfolio'],
    queryFn: fetchDashboardPortfolioPreference,
  });

  useEffect(() => {
    if (portfolioQuery.data?.scope) {
      setScope(portfolioQuery.data.scope);
    }
  }, [portfolioQuery.data?.scope]);

  const statsQuery = useQuery({
    queryKey: ['dashboard-stats', scope],
    queryFn: () => fetchDashboardStats({ portfolio: scope }),
  });
  const updatesQuery = useQuery({
    queryKey: ['dashboard-updates', scope],
    queryFn: () => fetchDashboardUpdates(5, { portfolio: scope }),
  });
  const criticalQuery = useQuery({
    queryKey: ['home-critical', scope],
    queryFn: () => fetchCriticalItems(3, { portfolio: scope }),
  });

  const stats = statsQuery.data?.stats;
  const actionTotal = stats?.actionItemsCount ?? 0;
  const criticalTotal = stats?.criticalCount ?? 0;
  const showBoth = criticalTotal > 0 && actionTotal > 0;
  const actionLimit = actionTotal > 0 ? (showBoth ? 2 : Math.min(actionTotal, 5)) : 0;

  const actionQuery = useQuery({
    queryKey: ['home-action-items', scope, actionLimit],
    queryFn: () => fetchOpenActionItems(actionLimit, { portfolio: scope }),
    enabled: actionLimit > 0,
  });

  const scopeMutation = useMutation({
    mutationFn: updateDashboardPortfolioPreference,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard-portfolio'] });
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({
      id,
      status,
      applies_to_me,
    }: {
      id: string;
      status: 'done' | 'cancelled';
      applies_to_me?: boolean;
    }) => updateActionItemStatus(id, status, applies_to_me !== undefined ? { applies_to_me } : undefined),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['home-action-items'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
      ]);
    },
  });

  const handleScopeChange = useCallback(
    (next: DashboardPortfolioScope) => {
      if (next === scope) return;
      setScope(next);
      void scopeMutation.mutate(next);
    },
    [scope, scopeMutation]
  );

  const isInitialLoading =
    (portfolioQuery.isLoading && !portfolioQuery.data) ||
    (statsQuery.isLoading && !statsQuery.data) ||
    (updatesQuery.isLoading && !updatesQuery.data) ||
    (criticalQuery.isLoading && !criticalQuery.data) ||
    (actionLimit > 0 && actionQuery.isLoading && !actionQuery.data);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        portfolioQuery.refetch(),
        statsQuery.refetch(),
        updatesQuery.refetch(),
        criticalQuery.refetch(),
        actionLimit > 0 ? actionQuery.refetch() : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [portfolioQuery, statsQuery, updatesQuery, criticalQuery, actionQuery, actionLimit]);

  const updates = updatesQuery.data?.updates ?? [];
  const criticalItems = criticalQuery.data?.items ?? [];
  const actionItems = actionQuery.data?.items ?? [];

  const handleActionStatus = useCallback(
    async (id: string, status: 'done' | 'cancelled', applies_to_me?: boolean) => {
      setBusyActionId(id);
      try {
        await actionMutation.mutateAsync({ id, status, applies_to_me });
      } finally {
        setBusyActionId(null);
      }
    },
    [actionMutation]
  );

  const attentionSubtitle = useMemo(() => {
    if (showBoth) return 'Critical findings first, then your follow-ups.';
    if (criticalTotal > 0) return 'Issues Sunny flagged across your projects.';
    if (actionTotal > 0) return 'Open follow-ups Sunny surfaced for you.';
    return 'What Sunny flagged and what changed recently.';
  }, [showBoth, criticalTotal, actionTotal]);

  return (
    <Screen>
      <RefreshableScroll
        refreshing={refreshing}
        onRefresh={refreshAll}
        header={
          <TabScreenHeader
            compactBrand={false}
            title="Executive Dashboard"
            subtitle={attentionSubtitle}
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
              <StatPill label="Critical" value={criticalTotal} tone="danger" />
              <StatPill label="New (24h)" value={stats?.newUpdatesCount ?? 0} tone="accent" />
              <StatPill label="Actions" value={actionTotal} tone="neutral" />
              <StatPill label="Conflicts" value={stats?.conflictsCount ?? 0} tone="neutral" />
            </View>

            {criticalTotal > 0 ? (
              <>
                <SectionHeader title="Critical items" count={criticalTotal} />
                {criticalItems.length === 0 ? (
                  <EmptyState title="All clear" body="No open critical items in this view." />
                ) : (
                  criticalItems.map((item) => <CriticalItemRow key={item.id} item={item} />)
                )}
              </>
            ) : null}

            {actionTotal > 0 ? (
              <>
                <SectionHeader title="Your action items" count={actionTotal} />
                {actionQuery.isLoading && actionItems.length === 0 ? (
                  <EmptyState title="Loading follow-ups" body="Fetching your open action items…" />
                ) : actionQuery.isError ? (
                  <EmptyState
                    title="Could not load action items"
                    body="Pull down to refresh and try again."
                  />
                ) : actionItems.length === 0 ? (
                  <EmptyState
                    title="No action items in this view"
                    body="Try another portfolio scope above Sunny updates."
                  />
                ) : (
                  <>
                    {actionItems.map((item) => (
                      <ActionItemRow
                        key={item.id}
                        item={item}
                        busy={busyActionId === item.id}
                        onDone={() => handleActionStatus(item.id, 'done')}
                        onDismiss={() => handleActionStatus(item.id, 'cancelled', false)}
                      />
                    ))}
                    {actionTotal > actionItems.length ? (
                      <Text style={styles.moreHint}>
                        {actionTotal - actionItems.length} more open{' '}
                        {actionTotal - actionItems.length === 1 ? 'follow-up' : 'follow-ups'}.
                      </Text>
                    ) : null}
                  </>
                )}
              </>
            ) : null}

            {criticalTotal === 0 && actionTotal === 0 ? (
              <EmptyState
                title="You're caught up"
                body="No critical findings or open actions in this view."
              />
            ) : null}

            <PortfolioScopeBar
              scope={scope}
              onScopeChange={handleScopeChange}
              disabled={scopeMutation.isPending}
            />
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
  moreHint: {
    marginTop: -4,
    marginBottom: spacing.sm,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  error: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: '#EF4444',
    fontSize: 14,
  },
});
