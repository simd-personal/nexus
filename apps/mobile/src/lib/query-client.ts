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

// v2: key bumped to discard caches persisted before the late-restore ownership
// fix — old caches may hold another account's data under the wrong owner.
const PERSIST_CACHE_KEY = 'upperdeck-query-cache-v2';
const CACHE_OWNER_KEY = 'upperdeck-query-cache-owner-v2';

/** Never block auth on cache restore for longer than this. */
const RESTORE_WAIT_TIMEOUT_MS = 3000;

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: PERSIST_CACHE_KEY,
  throttleTime: 2000,
});

// Cache wipes must run AFTER the persisted cache finishes hydrating into
// memory on cold start — otherwise a late restore resurrects the previous
// account's data and it flashes on screen until the first refetch.
let resolveRestored: (() => void) | undefined;
let restoreCompleted = false;
let wipedBeforeRestore = false;
const restoredPromise = new Promise<void>((resolve) => {
  resolveRestored = resolve;
});

/** Called by PersistQueryClientProvider once restore succeeds or fails. */
export function markQueryCacheRestored(): void {
  restoreCompleted = true;
  resolveRestored?.();

  // If a wipe already ran (waitForRestore timed out on a slow hydration), the
  // restore that just finished may have resurrected the previous account's
  // data into memory — and the persister would write it back to disk under the
  // new owner. Discard it again now that hydration is done.
  if (wipedBeforeRestore) {
    wipedBeforeRestore = false;
    queryClient.clear();
    void AsyncStorage.removeItem(PERSIST_CACHE_KEY);
  }
}

function noteWipe(): void {
  if (!restoreCompleted) {
    wipedBeforeRestore = true;
  }
}

function waitForRestore(): Promise<void> {
  return Promise.race([
    restoredPromise,
    new Promise<void>((resolve) => setTimeout(resolve, RESTORE_WAIT_TIMEOUT_MS)),
  ]);
}

/** Wipe all cached server data (memory + disk). Call on sign-out. */
export async function clearQueryCache(): Promise<void> {
  await waitForRestore();
  noteWipe();
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
  await waitForRestore();
  const owner = await AsyncStorage.getItem(CACHE_OWNER_KEY);
  if (owner === userId) return;

  noteWipe();
  queryClient.clear();
  await AsyncStorage.removeItem(PERSIST_CACHE_KEY);
  await AsyncStorage.setItem(CACHE_OWNER_KEY, userId);
}
