import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ActionItemActions,
  ActionItemDetailCard,
} from '@/components/ActionItemCard';
import { Button, Screen } from '@/components/ui';
import { fetchActionItem, updateActionItemStatus } from '@/lib/api';
import { spacing } from '@/theme/colors';

async function invalidateActionItemQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['action-item'] }),
    queryClient.invalidateQueries({ queryKey: ['action-items'] }),
    queryClient.invalidateQueries({ queryKey: ['home-action-items'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
  ]);
}

export default function ActionItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const itemId = typeof id === 'string' ? id : '';
  const [busy, setBusy] = useState(false);

  const query = useQuery({
    queryKey: ['action-item', itemId],
    queryFn: () => fetchActionItem(itemId),
    enabled: Boolean(itemId),
    retry: 2,
  });

  const mutation = useMutation({
    mutationFn: ({
      status,
      applies_to_me,
    }: {
      status: 'done' | 'in_progress' | 'cancelled';
      applies_to_me?: boolean;
    }) => updateActionItemStatus(itemId, status, applies_to_me !== undefined ? { applies_to_me } : undefined),
    onSuccess: async (_data, variables) => {
      await invalidateActionItemQueries(queryClient);
      if (variables.status === 'in_progress') {
        await query.refetch();
        return;
      }
      router.back();
    },
  });

  const applyStatus = useCallback(
    async (status: 'done' | 'in_progress' | 'cancelled', applies_to_me?: boolean) => {
      setBusy(true);
      try {
        await mutation.mutateAsync({ status, applies_to_me });
      } finally {
        setBusy(false);
      }
    },
    [mutation]
  );

  const item = query.data?.item;

  return (
    <>
      <Stack.Screen options={{ title: 'Action item' }} />
      <Screen edges={['left', 'right', 'bottom']}>
        {query.isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
          </View>
        ) : query.isError || !item ? (
          <View style={styles.centered}>
            <Text style={styles.errorTitle}>Could not load action item</Text>
            <Text style={styles.errorBody}>It may have been removed or is no longer available.</Text>
            <Button label="Go back" variant="secondary" onPress={() => router.back()} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <ActionItemDetailCard item={item} />
            <ActionItemActions
              item={item}
              busy={busy}
              onDone={() => applyStatus('done')}
              onInProgress={() => applyStatus('in_progress')}
              onDismiss={() => applyStatus('cancelled', false)}
            />
          </ScrollView>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0E1115',
  },
  errorBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
