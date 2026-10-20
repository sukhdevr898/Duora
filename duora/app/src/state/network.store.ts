import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';
import { logger } from '../utils/logger';

export type ConnectionKind = 'online' | 'offline' | 'reconnecting';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  socketState: 'connected' | 'connecting' | 'disconnected';
  lastConnectedAt: string | null;
  setSocketState: (state: NetworkState['socketState']) => void;
  setNetInfo: (info: { isConnected: boolean; isInternetReachable: boolean | null }) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: true,
  isInternetReachable: null,
  socketState: 'disconnected',
  lastConnectedAt: null,
  setSocketState: (socketState) =>
    set((s) => ({
      socketState,
      lastConnectedAt:
        socketState === 'connected' ? new Date().toISOString() : s.lastConnectedAt,
    })),
  setNetInfo: ({ isConnected, isInternetReachable }) => set({ isConnected, isInternetReachable }),
}));

let unsubscribe: (() => void) | null = null;

/** Subscribes to OS network state once, for the app's lifetime. */
export function startNetworkObserver(): void {
  if (unsubscribe) return;
  unsubscribe = NetInfo.addEventListener((state) => {
    useNetworkStore.getState().setNetInfo({
      isConnected: Boolean(state.isConnected),
      isInternetReachable: state.isInternetReachable,
    });
  });
  void NetInfo.fetch()
    .then((state) => {
      useNetworkStore.getState().setNetInfo({
        isConnected: Boolean(state.isConnected),
        isInternetReachable: state.isInternetReachable,
      });
    })
    .catch((err) => logger.warn('network', 'initial NetInfo.fetch failed', err));
}

export function stopNetworkObserver(): void {
  unsubscribe?.();
  unsubscribe = null;
}
