import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { getCurrentPairing } from '../features/pairing/pairing.api';
import { usePairingStore } from '../state/pairing.store';
import { useAuthStore } from '../state/auth.store';
import { logger } from '../utils/logger';

/** Refreshes pairing/presence when the app returns to the foreground. */
export function useAppStateRefresh(): void {
  useEffect(() => {
    const listener = (next: AppStateStatus) => {
      if (next !== 'active') return;
      if (!useAuthStore.getState().tokens) return;
      void getCurrentPairing()
        .then(({ pairing }) => usePairingStore.getState().setPairing(pairing))
        .catch((err) => logger.warn('appState', 'pairing refresh failed', err));
    };
    const subscription = AppState.addEventListener('change', listener);
    return () => subscription.remove();
  }, []);
}
