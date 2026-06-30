import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SunnyUpdateDetailCard } from '@/components/SunnyUpdateCard';
import { Button, Screen } from '@/components/ui';
import { fetchSunnyUpdate } from '@/lib/api';
import { spacing } from '@/theme/colors';

export default function SunnyUpdateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const updateId = typeof id === 'string' ? id : '';

  const query = useQuery({
    queryKey: ['sunny-update', updateId],
    queryFn: () => fetchSunnyUpdate(updateId),
    enabled: Boolean(updateId),
  });

  const update = query.data?.update;

  return (
    <>
      <Stack.Screen options={{ title: 'Sunny update', headerBackTitle: 'Back' }} />
      <Screen>
        {query.isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
          </View>
        ) : query.isError || !update ? (
          <View style={styles.centered}>
            <Text style={styles.errorTitle}>Could not load update</Text>
            <Text style={styles.errorBody}>It may have been removed or is no longer available.</Text>
            <Button label="Go back" variant="secondary" onPress={() => router.back()} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <SunnyUpdateDetailCard update={update} />
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
