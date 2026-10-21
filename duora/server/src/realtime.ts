/** Realtime channel (Socket.IO): presence, live messages, typing, calls. */
import type { Server as HttpServer } from 'node:http';
import { Server as IOServer, type Socket } from 'socket.io';
import { env, logger } from './env';
import { db } from './db';
import { nowIso } from './util';
import { verifyAccessToken } from './auth';
import * as chat from './routes/chat';
import * as calls from './routes/calls';
import * as pairing from './routes/pairing';

/** Socket.IO event names shared with the mobile client. */
export const EVENTS = {
  // client → server
  PRESENCE_PING: 'presence:ping',
  MESSAGE_SEND: 'message:send',
  MESSAGE_READ: 'message:read',
  TYPING: 'typing:start',
  PAIR_ACCEPT: 'pairing:accept',
  CALL_INVITE: 'call:invite',
  CALL_END: 'call:end',

  // server → client
  PRESENCE_UPDATE: 'presence:update',
  MESSAGE_NEW: 'message:new',
  MESSAGE_STATUS: 'message:status',
  TYPING_UPDATE: 'typing:update',
  PAIR_REQUEST: 'pairing:request',
  PAIR_MATCHED: 'pairing:matched',
  CALL_INCOMING: 'call:incoming',
  CALL_ENDED: 'call:ended',
  SERVER_HELLO: 'server:hello',
} as const;

export type ServerToClientEvents = {
  [EVENTS.PRESENCE_UPDATE]: (payload: { userId: string; online: boolean; lastSeenAt: string }) => void;
  [EVENTS.MESSAGE_NEW]: (payload: unknown) => void;
  [EVENTS.MESSAGE_STATUS]: (payload: { messageId: string; status: string }) => void;
  [EVENTS.TYPING_UPDATE]: (payload: { conversationId: string; userId: string; typing: boolean }) => void;
  [EVENTS.PAIR_REQUEST]: (payload: { fromUserId: string; code: string }) => void;
  [EVENTS.PAIR_MATCHED]: (payload: { partnerId: string; conversationId: string | null }) => void;
  [EVENTS.CALL_INCOMING]: (payload: { callId: string; fromUserId: string; kind: 'voice' | 'video' }) => void;
  [EVENTS.CALL_ENDED]: (payload: { callId: string; reason: string }) => void;
  [EVENTS.SERVER_HELLO]: (payload: { userId: string; serverTime: string; version: string }) => void;
};

export type ClientToServerEvents = {
  [EVENTS.PRESENCE_PING]: () => void;
  [EVENTS.MESSAGE_SEND]: (payload: { conversationId: string; clientMessageId: string; text: string; sticker?: string | null }) => void;
  [EVENTS.MESSAGE_READ]: (payload: { conversationId: string }) => void;
  [EVENTS.TYPING]: (payload: { conversationId: string; typing: boolean }) => void;
  [EVENTS.PAIR_ACCEPT]: (payload: { code: string }) => void;
  [EVENTS.CALL_INVITE]: (payload: { kind: 'voice' | 'video' }) => void;
  [EVENTS.CALL_END]: (payload: { callId: string; reason?: string }) => void;
};

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
