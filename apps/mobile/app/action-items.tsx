import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionItemPreviewRow } from '@/components/ActionItemCard';
import { PortfolioScopeBar } from '@/components/PortfolioScopeBar';
import { RefreshableScroll } from '@/components/RefreshableScroll';
import { EmptyState, Screen } from '@/components/ui';
import {
  fetchActionItems,
  fetchDashboardPortfolioPreference,
  updateDashboardPortfolioPreference,
} from '@/lib/api';
import type { ActionItem, DashboardPortfolioScope } from '@/lib/types';
import { BRAND, radius, spacing } from '@/theme/colors';

type ActionItemTab = ActionItem['status'];

const TABS: { id: ActionItemTab; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
  { id: 'cancelled', label: 'Not for me' },
];

const EMPTY_MESSAGES: Record<ActionItemTab, string> = {
  open: 'No open action items for you right now.',
  in_progress: 'Nothing marked as in progress.',
  done: 'No completed action items yet.',
  cancelled: 'No dismissed action items.',
};

export default function ActionItemsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<ActionItemTab>('open');
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

  const itemsQuery = useQuery({
    queryKey: ['action-items', tab, scope],
    queryFn: () => fetchActionItems({ status: tab, portfolio: scope }),
  });

  const scopeMutation = useMutation({
    mutationFn: updateDashboardPortfolioPreference,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard-portfolio'] });
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

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([portfolioQuery.refetch(), itemsQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [portfolioQuery, itemsQuery]);

  const items = itemsQuery.data?.items ?? [];

  return (
    <>
      <Stack.Screen options={{ title: 'Your action items' }} />
      <Screen edges={['left', 'right', 'bottom']}>
        <RefreshableScroll
          refreshing={refreshing}
          onRefresh={refresh}
          header={
            <View style={styles.header}>
              <Text style={styles.subtitle}>
                Open follow-ups Sunny surfaced for you in your selected portfolio.
              </Text>
              <PortfolioScopeBar
                scope={scope}
                onScopeChange={handleScopeChange}
                disabled={scopeMutation.isPending}
              />
              <View style={styles.tabs}>
                {TABS.map(({ id, label }) => {
                  const active = tab === id;
                  return (
                    <Pressable
                      key={id}
                      onPress={() => setTab(id)}
                      style={[styles.tab, active && styles.tabActive]}
                    >
                      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          }
        >
          {itemsQuery.isLoading && items.length === 0 ? (
            <EmptyState title="Loading action items" body="Fetching your follow-ups…" />
          ) : itemsQuery.isError ? (
            <EmptyState title="Could not load action items" body="Pull down to refresh and try again." />
          ) : items.length === 0 ? (
            <EmptyState title="Nothing here" body={EMPTY_MESSAGES[tab]} />
          ) : (
            items.map((item) => (
              <ActionItemPreviewRow
                key={item.id}
                item={item}
                onPress={() => router.push(`/action-item/${item.id}`)}
              />
            ))
          )}
        </RefreshableScroll>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.textMuted,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tab: {
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
  },
  tabActive: {
    backgroundColor: '#EEF2FF',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabLabelActive: {
    color: BRAND.accent,
    fontWeight: '600',
  },
});
