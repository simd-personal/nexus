import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useEffect, type ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  asyncStoragePersister,
  PERSIST_MAX_AGE_MS,
  queryClient,
} from '@/lib/query-client';

function RefetchOnAppForeground() {
  useEffect(() => {
    let lastState: AppStateStatus = AppState.currentState;

    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasBackground = lastState === 'background' || lastState === 'inactive';
      if (wasBackground && nextState === 'active') {
        void queryClient.refetchQueries({ stale: true });
      }
      lastState = nextState;
    });

    return () => subscription.remove();
  }, []);

  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: asyncStoragePersister,
          maxAge: PERSIST_MAX_AGE_MS,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => query.state.status === 'success',
          },
        }}
      >
        <RefetchOnAppForeground />
        {children}
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}

export { queryClient };
