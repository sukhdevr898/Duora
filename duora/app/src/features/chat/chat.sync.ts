import { SocketEvents } from '../../constants/events';
import { getSocket, emitWithAck } from '../../services/socketClient';
import { useChatStore } from '../../state/chat.store';
import { useAuthStore } from '../../state/auth.store';
import { useNetworkStore } from '../../state/network.store';
import * as chatApi from './chat.api';
import * as repo from '../../repositories/chat.repository';
import { uuid } from '../../utils/ids';
import { nextBackoffMs, delay } from '../../utils/backoff';
import { logger } from '../../utils/logger';
import type { Message } from '../../types/models';

interface AckResponse {
  ok: boolean;
  clientMessageId: string;
  message: Message;
  error?: { code: string; message: string };
}

/** Loads the first page from the server and falls back to SQLite offline. */
export async function loadInitialMessages(conversationId: string): Promise<void> {
  const store = useChatStore.getState();
  store.ensureConversation(conversationId);
  try {
    const { messages, nextCursor } = await chatApi.fetchMessages(conversationId);
    useChatStore.getState().setMessages(conversationId, messages, nextCursor);
    await repo.cacheMessages(messages);
    await repo.setSyncWatermark(conversationId, new Date().toISOString());
  } catch (err) {
    logger.warn('chat.sync', 'history fetch failed — using local cache', err);
    const cached = await repo.getCachedMessages(conversationId, 50);
    useChatStore.getState().setMessages(conversationId, cached, null);
  }
}

export async function loadOlderMessages(conversationId: string): Promise<void> {
  const conv = useChatStore.getState().conversations[conversationId];
  if (!conv?.nextCursor || conv.loadingOlder) return;
  useChatStore.getState().setLoadingOlder(conversationId, true);
  try {
    const page = await chatApi.fetchMessages(conversationId, conv.nextCursor);
    useChatStore.getState().prependMessages(conversationId, page.messages, page.nextCursor);
    await repo.cacheMessages(page.messages);
  } catch (err) {
    logger.warn('chat.sync', 'pagination failed', err);
    useChatStore.getState().setLoadingOlder(conversationId, false);
  }
}

function optimisticMessage(conversationId: string, clientMessageId: string, text: string, replyToId?: string): Message {
  const userId = useAuthStore.getState().user?.id ?? 'local';
  return {
    id: `local-${clientMessageId}`,
    conversationId,
    senderId: userId,
    clientMessageId,
    type: 'TEXT',
    text,
    replyToId: replyToId ?? null,
    createdAt: new Date().toISOString(),
    deliveryStatus: 'sending',
  };
}

/**
 * Sends a message. Optimistic UI first; socket acknowledgement makes it
 * durable. Without a connection the message lands in the SQLite outbox.
 */
export async function sendMessage(
  conversationId: string,
  text: string,
  replyToId?: string,
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  const clientMessageId = uuid();
  const optimistic = optimisticMessage(conversationId, clientMessageId, trimmed, replyToId);
  const store = useChatStore.getState();
  store.ensureConversation(conversationId);
  store.upsertMessage(conversationId, optimistic);
  store.setDraft(conversationId, '');
  await repo.saveDraft(conversationId, '');

  const socket = getSocket();
  if (!socket?.connected) {
    useChatStore.getState().updateMessage(conversationId, clientMessageId, { deliveryStatus: 'pending' });
    await repo.enqueueOutbox(conversationId, { conversationId, text: trimmed, replyToId });
    return;
  }

  try {
    const ack = await emitWithAck<AckResponse>(
      SocketEvents.MESSAGE_SEND,
      { conversationId, clientMessageId, text: trimmed, type: 'TEXT', replyToId },
      10_000,
    );
    if (!ack.ok) throw new Error(ack.error?.message ?? 'send rejected');
    useChatStore.getState().upsertMessage(conversationId, { ...ack.message, deliveryStatus: 'sent' });
    await repo.cacheMessages([ack.message]);
  } catch (err) {
    logger.warn('chat.sync', 'socket send failed — queued offline', err);
    useChatStore.getState().updateMessage(conversationId, clientMessageId, { deliveryStatus: 'failed' });
    await repo.enqueueOutbox(conversationId, { conversationId, text: trimmed, replyToId });
  }
}

/** Drains the offline outbox after (re)connection, with bounded backoff. */
export async function processOutbox(): Promise<void> {
  if (useNetworkStore.getState().socketState !== 'connected') return;
  const entries = await repo.getOutbox();
  for (const entry of entries) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const ack = await emitWithAck<AckResponse>(SocketEvents.MESSAGE_SEND, {
          ...entry.payload,
          clientMessageId: entry.clientMessageId,
        });
        if (!ack.ok) throw new Error(ack.error?.message ?? 'rejected');
        useChatStore
          .getState()
          .upsertMessage(entry.conversationId, { ...ack.message, deliveryStatus: 'sent' });
        await repo.cacheMessages([ack.message]);
        await repo.removeOutbox(entry.clientMessageId);
        break;
      } catch (err) {
        await repo.markOutboxAttempt(entry.clientMessageId, entry.attempts + 1);
        logger.warn('chat.sync', `outbox retry ${attempt + 1} failed`, err);
        await delay(nextBackoffMs(attempt));
      }
    }
  }
}

/** Reconciles anything missed while disconnected (cursor-free watermark sync). */
export async function reconcile(conversationId: string): Promise<void> {
  const since = (await repo.getSyncWatermark(conversationId)) ?? new Date(0).toISOString();
  try {
    const { messages, receipts } = await chatApi.syncMessages(conversationId, since);
    if (messages.length > 0) {
      messages.forEach((m) => useChatStore.getState().upsertMessage(conversationId, m));
      await repo.cacheMessages(messages);
    }
    if (receipts.length > 0) {
      useChatStore.getState().markDeliveredByPartner(conversationId);
    }
    await repo.setSyncWatermark(conversationId, new Date().toISOString());
  } catch (err) {
    logger.warn('chat.sync', 'reconcile failed', err);
  }
}

export async function retryMessage(conversationId: string, clientMessageId: string): Promise<void> {
  const conv = useChatStore.getState().conversations[conversationId];
  const message = conv?.messages.find((m) => m.clientMessageId === clientMessageId);
  if (!message) return;
  useChatStore.getState().updateMessage(conversationId, clientMessageId, { deliveryStatus: 'sending' });
  try {
    const ack = await emitWithAck<AckResponse>(SocketEvents.MESSAGE_SEND, {
      conversationId,
      clientMessageId,
      text: message.text,
      type: message.type,
      replyToId: message.replyToId ?? undefined,
    });
    if (!ack.ok) throw new Error(ack.error?.message);
    useChatStore.getState().upsertMessage(conversationId, { ...ack.message, deliveryStatus: 'sent' });
    await repo.cacheMessages([ack.message]);
  } catch (err) {
    useChatStore.getState().updateMessage(conversationId, clientMessageId, { deliveryStatus: 'failed' });
    logger.warn('chat.sync', 'retry failed', err);
  }
}
