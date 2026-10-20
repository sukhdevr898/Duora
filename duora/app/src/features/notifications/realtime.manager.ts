import type { Socket } from 'socket.io-client';
import { SocketEvents } from '../../constants/events';
import { getSocket } from '../../services/socketClient';
import { useChatStore } from '../../state/chat.store';
import { usePairingStore } from '../../state/pairing.store';
import { useNetworkStore } from '../../state/network.store';
import { useSettingsStore } from '../../state/settings.store';
import { useAuthStore } from '../../state/auth.store';
import * as chatApi from '../chat/chat.api';
import { processOutbox, reconcile } from '../chat/chat.sync';
import { getCurrentPairing } from '../pairing/pairing.api';
import { presentNotification } from './notifications.service';
import { NotificationIds } from '../../constants/notification';
import { logger } from '../../utils/logger';
import type { Message, PairingState, Presence } from '../../types/models';

type Cleanup = () => void;

let activeCleanup: Cleanup | null = null;

/**
 * Binds server events to local stores for the authenticated session.
 * Idempotent: calling twice simply re-binds on the current socket.
 */
export function startRealtime(): Cleanup {
  activeCleanup?.();
  const socket: Socket | null = getSocket();
  if (!socket) return () => undefined;

  const onConnect = () => {
    void processOutbox();
    const pairing = usePairingStore.getState().pairing;
    if (pairing.status === 'ACTIVE' && pairing.conversationId) {
      void reconcile(pairing.conversationId);
    }
  };

  const onMessageNew = async (payload: { message: Message }) => {
    const message = payload.message;
    const state = usePairingStore.getState();
    const conversationId = state.pairing.conversationId ?? message.conversationId;
    useChatStore.getState().ensureConversation(conversationId);
    useChatStore.getState().upsertMessage(conversationId, { ...message, deliveryStatus: 'delivered' });

    // Receipt fan-out: we received it, mark delivered immediately.
    void chatApi.markDelivered(conversationId).catch(() => undefined);

    const settings = useSettingsStore.getState();
    if (!settings.messageNotifications) return;
    const senderName = state.pairing.partner?.displayName ?? 'Your partner';
    await presentNotification({
      kind: 'message',
      title: senderName,
      body: settings.hidePreview ? 'New message' : message.text.slice(0, 200),
      data: { kind: 'message', conversationId, messageId: message.id },
      stableId: NotificationIds.message(conversationId),
    });
  };

  const onTypingStart = (payload: { conversationId: string }) => {
    useChatStore.getState().setPartnerTyping(payload.conversationId, true);
  };
  const onTypingStop = (payload: { conversationId: string }) => {
    useChatStore.getState().setPartnerTyping(payload.conversationId, false);
  };

  const onRead = (payload: { conversationId: string }) => {
    useChatStore.getState().markReadByPartner(payload.conversationId, new Date().toISOString());
  };
  const onDelivered = (payload: { conversationId: string }) => {
    useChatStore.getState().markDeliveredByPartner(payload.conversationId);
  };

  const onPairingUpdate = async (payload: PairingState | { status: string }) => {
    if (payload.status === 'UNLINKED') {
      usePairingStore.getState().setPairing({ status: 'UNPAIRED' });
      return;
    }
    try {
      const fresh = await getCurrentPairing();
      usePairingStore.getState().setPairing(fresh.pairing);
    } catch (err) {
      logger.warn('realtime', 'pairing refresh failed', err);
    }
  };

  const onPresence = (payload: Presence) => {
    if (payload.userId === usePairingStore.getState().pairing.partner?.id) {
      usePairingStore.getState().setPresence(payload);
    }
  };

  socket.on('connect', onConnect);
  socket.on(SocketEvents.MESSAGE_NEW, onMessageNew);
  socket.on(SocketEvents.TYPING_START, onTypingStart);
  socket.on(SocketEvents.TYPING_STOP, onTypingStop);
  socket.on(SocketEvents.MESSAGE_READ, onRead);
  socket.on(SocketEvents.MESSAGE_DELIVERED, onDelivered);
  socket.on(SocketEvents.PAIRING_UPDATE, onPairingUpdate);
  socket.on(SocketEvents.PRESENCE_UPDATE, onPresence);

  const unsubNetwork = useNetworkStore.subscribe((state, prev) => {
    if (state.socketState === 'connected' && prev.socketState !== 'connected') void processOutbox();
  });

  const cleanup = () => {
    socket.off('connect', onConnect);
    socket.off(SocketEvents.MESSAGE_NEW, onMessageNew);
    socket.off(SocketEvents.TYPING_START, onTypingStart);
    socket.off(SocketEvents.TYPING_STOP, onTypingStop);
    socket.off(SocketEvents.MESSAGE_READ, onRead);
    socket.off(SocketEvents.MESSAGE_DELIVERED, onDelivered);
    socket.off(SocketEvents.PAIRING_UPDATE, onPairingUpdate);
    socket.off(SocketEvents.PRESENCE_UPDATE, onPresence);
    unsubNetwork();
  };
  activeCleanup = cleanup;
  return cleanup;
}

export function stopRealtime(): void {
  activeCleanup?.();
  activeCleanup = null;
}

export function currentUserId(): string | undefined {
  return useAuthStore.getState().user?.id;
}
