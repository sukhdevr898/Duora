import type { Server as HttpServer } from 'node:http';
import { Server as IOServer, type Socket } from 'socket.io';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { db } from '../db/client';
import { nowIso } from '../utils/ids';
import { verifyAccessToken } from '../utils/jwt';
import * as chat from '../modules/chat/chat.service';
import * as calls from '../modules/calls/calls.service';
import * as pairing from '../modules/pairing/pairing.service';
import { EVENTS, type ClientToServerEvents, type ServerToClientEvents } from './events';

type AuthedSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  data: { userId: string };
};

/** userId → set of live sockets. */
const presence = new Map<string, Set<string>>();

export function createSocketServer(httpServer: HttpServer): IOServer {
  const io = new IOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: env.corsOrigins.length ? env.corsOrigins : true,
      credentials: true,
    },
    path: '/socket.io',
  });

  io.use((socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.headers.authorization?.split(' ')[1] ?? '');
    if (!token) {
      next(new Error('unauthorized'));
      return;
    }
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const s = socket as AuthedSocket;
    const userId = s.data.userId;
    markOnline(userId, true);
    s.emit(EVENTS.SERVER_HELLO, {
      userId,
      serverTime: nowIso(),
      version: env.APP_VERSION,
    });

    // Put the socket in its personal room + its conversation room.
    void pairing
      .conversationIdFor(userId)
      .then((conversationId) => joinRooms(s, conversationId, userId))
      .catch(() => joinRooms(s, null, userId));

    s.on(EVENTS.PRESENCE_PING, () => {
      markOnline(userId, true);
    });

    s.on(EVENTS.MESSAGE_SEND, async (payload) => {
      try {
        const message = await chat.sendMessage(userId, payload.conversationId, {
          clientMessageId: payload.clientMessageId,
          text: payload.text,
          sticker: payload.sticker ?? null,
        });
        io.to(room(payload.conversationId)).emit(EVENTS.MESSAGE_NEW, { message });
        await chat.markRead(userId, payload.conversationId);
      } catch (err) {
        logger.warn({ err: String(err) }, 'socket message failed');
      }
    });

    s.on(EVENTS.MESSAGE_READ, async (payload) => {
      try {
        await chat.markRead(userId, payload.conversationId);
        s.to(room(payload.conversationId)).emit(EVENTS.MESSAGE_STATUS, {
          messageId: payload.conversationId,
          status: 'read',
        });
      } catch (err) {
        logger.warn({ err: String(err) }, 'socket read failed');
      }
    });

    s.on(EVENTS.TYPING, (payload) => {
      s.to(room(payload.conversationId)).emit(EVENTS.TYPING_UPDATE, {
        conversationId: payload.conversationId,
        userId,
        typing: payload.typing,
      });
    });

    s.on(EVENTS.PAIR_ACCEPT, async (payload) => {
      try {
        const status = await pairing.acceptByCode(userId, payload.code);
        s.emit(EVENTS.PAIR_MATCHED, {
          partnerId: status.partner?.id ?? '',
          conversationId: status.conversationId,
        });
      } catch (err) {
        logger.warn({ err: String(err) }, 'socket pairing failed');
      }
    });

    s.on(EVENTS.CALL_INVITE, async (payload) => {
      try {
        const call = await calls.startCall(userId, payload.kind);
        const partnerId = await partnerIdOf(userId);
        if (partnerId) {
          io.to(userRoom(partnerId)).emit(EVENTS.CALL_INCOMING, {
            callId: call.id,
            fromUserId: userId,
            kind: payload.kind,
          });
        }
      } catch (err) {
        logger.warn({ err: String(err) }, 'socket call invite failed');
      }
    });

    s.on(EVENTS.CALL_END, async (payload) => {
      try {
        await calls.endCall(userId, payload.callId, 'ENDED');
        io.to(room(payload.callId)).emit(EVENTS.CALL_ENDED, {
          callId: payload.callId,
          reason: payload.reason ?? 'ended',
        });
      } catch (err) {
        logger.warn({ err: String(err) }, 'socket call end failed');
      }
    });

    s.on('disconnect', () => {
      const set = presence.get(userId);
      if (set) {
        set.delete(s.id);
        if (set.size === 0) {
          presence.delete(userId);
          void markOnline(userId, false);
        }
      }
    });
  });

  return io;
}

/** Joins a socket to the conversation + personal rooms it needs. */
export async function joinRooms(socket: Socket, conversationId: string | null, userId: string): Promise<void> {
  socket.join(userRoom(userId));
  if (conversationId) socket.join(room(conversationId));
}

export const room = (conversationId: string): string => `conversation:${conversationId}`;
export const userRoom = (userId: string): string => `user:${userId}`;

async function markOnline(userId: string, online: boolean): Promise<void> {
  const now = nowIso();
  const existing = await db().one('SELECT user_id FROM presence WHERE user_id = ?', [userId]);
  if (existing) {
    await db().run(
      'UPDATE presence SET online = ?, last_seen_at = ?, updated_at = ? WHERE user_id = ?',
      [online ? 1 : 0, now, now, userId],
    );
  } else {
    await db().run(
      'INSERT INTO presence (user_id, online, last_seen_at, updated_at) VALUES (?, ?, ?, ?)',
      [userId, online ? 1 : 0, now, now],
    );
  }
}

async function partnerIdOf(userId: string): Promise<string | null> {
  const status = await pairing.statusFor(userId);
  return status.partner?.id ?? null;
}
