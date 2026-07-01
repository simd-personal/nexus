import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { CriticalItemRow } from '@/components/lists';
import { RefreshableScroll } from '@/components/RefreshableScroll';
import { TabScreenHeader } from '@/components/BrandHeader';
import { EmptyState, Screen } from '@/components/ui';
import { SwipeTabView } from '@/components/SwipeTabView';
import { fetchCriticalItems, updateCriticalItemStatus } from '@/lib/api';

export default function CriticalScreen() {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const query = useQuery({ queryKey: ['critical-items'], queryFn: () => fetchCriticalItems() });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'acknowledged' | 'resolved' }) =>
      updateCriticalItemStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['critical-items'] });
      await queryClient.invalidateQueries({ queryKey: ['home-critical'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  async function handleStatus(id: string, status: 'acknowledged' | 'resolved') {
    setBusyId(id);
    try {
      await mutation.mutateAsync({ id, status });
    } finally {
      setBusyId(null);
    }
  }

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await query.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [query]);

  const items = query.data?.items ?? [];

  return (
    <Screen>
    <SwipeTabView current="critical">
      <RefreshableScroll
        refreshing={refreshing}
        onRefresh={refresh}
        header={
          <TabScreenHeader
            title="Critical Items"
            subtitle="Issues Sunny flagged that need your attention."
          />
        }
      >
        {items.length === 0 && !query.isLoading ? (
          <EmptyState title="No open critical items" body="You're caught up across your portfolio." />
        ) : (
          items.map((item) => (
            <CriticalItemRow
              key={item.id}
              item={item}
              busy={busyId === item.id}
              onAcknowledge={() => handleStatus(item.id, 'acknowledged')}
              onResolve={() => handleStatus(item.id, 'resolved')}
            />
          ))
        )}

        {query.isError ? <Text style={styles.error}>Could not load critical items.</Text> : null}
      </RefreshableScroll>
    </SwipeTabView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: {
    color: '#EF4444',
    textAlign: 'center',
  },
});
