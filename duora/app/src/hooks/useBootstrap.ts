import { getDatabase } from '../database/sqlite';
import { startNetworkObserver } from '../state/network.store';
import { useAuthStore } from '../state/auth.store';
import { usePairingStore } from '../state/pairing.store';
import { connectSocket, disconnectSocket } from '../services/socketClient';
import { registerSessionExpiredHandler } from '../services/httpClient';
import { getCurrentPairing } from '../features/pairing/pairing.api';
import { startRealtime, stopRealtime } from '../features/notifications/realtime.manager';
import {
  configureChannels,
  observeNotificationTaps,
  registerDevicePushToken,
  registerTapRouter,
} from '../features/notifications/notifications.service';
import { callCoordinator } from '../features/calling/CallCoordinator';
import { logger } from '../utils/logger';

/** Minimal structural router type used by bootstrap navigation. */
export type RouterLike = {
  // Method syntax is bivariant under strictFunctionTypes, matching Expo Router.
  push(href: string | object): void;
  replace(href: string | object): void;
  back(): void;
};

/**
 * App-wide startup. Local persistence initializes first; all server calls are
 * best-effort and never block the UI on an unreachable backend.
 */
export async function bootstrapApp(router: RouterLike): Promise<void> {
  await getDatabase();
  startNetworkObserver();
  await configureChannels();

  registerTapRouter((data) => routeFromNotification(data, router));
  observeNotificationTaps();

  registerSessionExpiredHandler(() => {
    deactivateSession();
    router.replace('/auth/login');
  });

  callCoordinator.setIncomingCallHandler((invite) => {
    router.push({ pathname: '/call/incoming', params: { callId: invite.callId, callType: invite.callType } });
  });

  const auth = useAuthStore.getState();
  if (auth.tokens && auth.user) {
    await activateSession();
  }
}

let callEventCleanup: (() => void) | null = null;

export async function activateSession(): Promise<void> {
  const socket = connectSocket();
  if (socket) {
    startRealtime();
    callEventCleanup = callCoordinator.bindGlobalSocketEvents();
  }
  void registerDevicePushToken();
  try {
    const { pairing } = await getCurrentPairing();
    usePairingStore.getState().setPairing(pairing);
  } catch (err) {
    usePairingStore.getState().setLoading(false);
    logger.warn('bootstrap', 'initial pairing fetch failed', err);
  }
}

export async function reconnectSocket(): Promise<void> {
  disconnectSocket();
  await activateSession();
}

export function deactivateSession(): void {
  callEventCleanup?.();
  callEventCleanup = null;
  stopRealtime();
  disconnectSocket();
  usePairingStore.getState().reset();
  useChatReset();
}

function useChatReset(): void {
  // Local import avoids a cycle at module evaluation time.
  const { useChatStore } = require('../state/chat.store') as typeof import('../state/chat.store');
  useChatStore.getState().reset();
}

function routeFromNotification(data: Record<string, unknown>, router: RouterLike): void {
  const kind = data.kind;
  if (kind === 'incoming_call' && typeof data.callId === 'string') {
    router.push({ pathname: '/call/incoming', params: { callId: data.callId, callType: String(data.callType ?? 'AUDIO') } });
    return;
  }
  if (kind === 'message' && typeof data.conversationId === 'string') {
    router.push({ pathname: '/conversation/[conversationId]', params: { conversationId: data.conversationId } });
    return;
  }
  if (kind === 'missed_call') {
    router.push('/(tabs)/home');
  }
}
