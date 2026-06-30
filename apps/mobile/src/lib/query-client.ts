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

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'upperdeck-query-cache',
  throttleTime: 2000,
});
