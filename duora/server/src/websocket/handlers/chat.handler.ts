import type { Socket } from 'socket.io';
import { z } from 'zod';
import { SocketEvents } from '../events';
import * as chatService from '../../modules/chat/chat.service';
import { findActivePairing, partnerIdOf, authorizeConversation } from '../../services/relationship.service';
import { isUserOnline, emitToUser } from '../socketState';
import { sendToUser } from '../../modules/push/push.service';
import { prisma } from '../../database/prisma';

const sendSchema = z.object({
  conversationId: z.string().min(1).max(64),
  clientMessageId: z.string().uuid(),
  text: z.string().trim().min(1).max(4000),
  type: z.enum(['TEXT', 'ATTACHMENT']).default('TEXT'),
  attachmentUrl: z.string().url().max(2000).optional(),
  attachmentMeta: z.record(z.unknown()).optional(),
  replyToId: z.string().max(64).optional(),
});

const conversationSchema = z.object({ conversationId: z.string().min(1).max(64) });
const readSchema = z.object({ conversationId: z.string().min(1).max(64), messageId: z.string().max(64).optional() });

// Server-side throttle for typing indicators and read fan-out.
const lastTyping = new Map<string, number>();
const TYPING_WINDOW_MS = 2500;

export function registerChatHandlers(socket: Socket, userId: string): void {
  socket.on(SocketEvents.MESSAGE_SEND, async (raw: unknown, ack?: (response: unknown) => void) => {
    const parsed = sendSchema.safeParse(raw);
    if (!parsed.success) {
      ack?.({ ok: false, error: { code: 'validation_error', details: parsed.error.flatten() } });
      return;
    }
    try {
      const message = await chatService.sendMessage(userId, parsed.data);
      const { partnerId } = await authorizeConversation(userId, parsed.data.conversationId);

      // Durable acceptance confirmed to the sender; client replaces its pending row.
      const ackPayload = { ok: true, clientMessageId: parsed.data.clientMessageId, message };
      if (typeof ack === 'function') ack(ackPayload);
      socket.emit(SocketEvents.MESSAGE_ACK, ackPayload);

      emitToUser(partnerId, SocketEvents.MESSAGE_NEW, { message });

      if (!isUserOnline(partnerId)) {
        const settings = await prisma.userSettings.findUnique({ where: { userId: partnerId } });
        if (!settings || settings.messageNotifications) {
          await sendToUser(partnerId, {
            title: 'Duora — new message',
            body: settings?.hidePreview ? 'New message from your partner' : message.text.slice(0, 200),
            data: {
              kind: 'message',
              conversationId: parsed.data.conversationId,
              messageId: message.id,
            },
            channelId: 'messages',
          });
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'send failed';
      if (typeof ack === 'function') ack({ ok: false, error: { code: 'send_failed', message: error } });
    }
  });

  socket.on(SocketEvents.TYPING_START, (raw: unknown) => {
    const parsed = conversationSchema.safeParse(raw);
    if (!parsed.success) return;
    const key = `${userId}:${parsed.data.conversationId}`;
    const now = Date.now();
    if (now - (lastTyping.get(key) ?? 0) < TYPING_WINDOW_MS) return;
    lastTyping.set(key, now);
    void relayToPartner(socket, userId, parsed.data.conversationId, SocketEvents.TYPING_START, {
      conversationId: parsed.data.conversationId,
      at: new Date().toISOString(),
    });
  });

  socket.on(SocketEvents.TYPING_STOP, (raw: unknown) => {
    const parsed = conversationSchema.safeParse(raw);
    if (!parsed.success) return;
    lastTyping.delete(`${userId}:${parsed.data.conversationId}`);
    void relayToPartner(socket, userId, parsed.data.conversationId, SocketEvents.TYPING_STOP, {
      conversationId: parsed.data.conversationId,
      at: new Date().toISOString(),
    });
  });

  socket.on(SocketEvents.MESSAGE_DELIVERED, async (raw: unknown) => {
    const parsed = conversationSchema.safeParse(raw);
    if (!parsed.success) return;
    try {
      await chatService.markDelivered(userId, parsed.data.conversationId);
      const { partnerId } = await authorizeConversation(userId, parsed.data.conversationId);
      emitToUser(partnerId, SocketEvents.MESSAGE_DELIVERED, {
        conversationId: parsed.data.conversationId,
        at: new Date().toISOString(),
      });
    } catch {
      /* authorization/validation failures are ignored for receipt fan-out */
    }
  });

  socket.on(SocketEvents.MESSAGE_READ, async (raw: unknown) => {
    const parsed = readSchema.safeParse(raw);
    if (!parsed.success) return;
    try {
      const result = await chatService.markRead(userId, parsed.data.conversationId, parsed.data.messageId);
      const { partnerId } = await authorizeConversation(userId, parsed.data.conversationId);
      emitToUser(partnerId, SocketEvents.MESSAGE_READ, {
        conversationId: parsed.data.conversationId,
        ...result,
      });
    } catch {
      /* ignore receipt errors */
    }
  });
}

async function relayToPartner(
  _socket: Socket,
  userId: string,
  conversationId: string,
  event: string,
  payload: unknown,
): Promise<void> {
  try {
    const auth = await authorizeConversation(userId, conversationId);
    emitToUser(auth.partnerId, event, payload);
  } catch {
    /* not a participant — ignore */
  }
}

/** Emits current presence to the user's partner once pairing is known. */
export async function emitInitialPresence(userId: string): Promise<void> {
  const pairing = await findActivePairing(userId);
  if (!pairing) return;
  const partnerId = partnerIdOf(pairing, userId);
  emitToUser(partnerId, SocketEvents.PRESENCE_UPDATE, {
    userId,
    online: true,
    at: new Date().toISOString(),
  });
}
