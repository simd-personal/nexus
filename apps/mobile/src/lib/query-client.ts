import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

/** How long cached query data stays fresh before a background refetch. */
export const QUERY_STALE_TIME_MS = 5 * 60 * 1000;

/** Keep unused cache entries long enough to survive cold starts. */
export const QUERY_GC_TIME_MS = 24 * 60 * 60 * 1000;

/** Discard persisted cache older than this on restore. */
export const PERSIST_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME_MS,
      gcTime: QUERY_GC_TIME_MS,
      retry: 1,
      refetchOnReconnect: true,
    },
  },
});

const PERSIST_CACHE_KEY = 'upperdeck-query-cache';
const CACHE_OWNER_KEY = 'upperdeck-query-cache-owner';

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: PERSIST_CACHE_KEY,
  throttleTime: 2000,
});

/** Wipe all cached server data (memory + disk). Call on sign-out. */
export async function clearQueryCache(): Promise<void> {
  queryClient.clear();
  await Promise.all([
    AsyncStorage.removeItem(PERSIST_CACHE_KEY),
    AsyncStorage.removeItem(CACHE_OWNER_KEY),
  ]);
}

/**
 * Ensures cached data belongs to the signed-in user. If the cache was written
 * by a different (or unknown) account, wipe it so the previous user's data
 * never flashes after sign-in.
 */
export async function ensureQueryCacheOwner(userId: string): Promise<void> {
  const owner = await AsyncStorage.getItem(CACHE_OWNER_KEY);
  if (owner === userId) return;

  queryClient.clear();
  await AsyncStorage.removeItem(PERSIST_CACHE_KEY);
  await AsyncStorage.setItem(CACHE_OWNER_KEY, userId);
}
