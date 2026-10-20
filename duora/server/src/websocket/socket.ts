import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { verifyAccessToken } from '../middleware/auth.middleware';
import { bindIo, registerSocket, unregisterSocket } from './socketState';
import { registerChatHandlers, emitInitialPresence } from './handlers/chat.handler';
import { registerCallHandlers } from './handlers/call.handler';
import * as presenceService from '../modules/presence/presence.service';
import { findActivePairing, partnerIdOf } from '../services/relationship.service';
import { SocketEvents } from './events';

// Lightweight tuning: fewer heartbeats saves CPU + bandwidth on Render free tier.
// 25s ping / 30s timeout keeps 2-person presence accurate without aggressive polling.
const HEARTBEAT_TIMEOUT_MS = 30_000;

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: env.corsOrigins.length > 0 ? env.corsOrigins : true, credentials: true },
    maxHttpBufferSize: 1_000_000, // 1 MB cap on signaling payloads
    pingInterval: 25_000,
    pingTimeout: HEARTBEAT_TIMEOUT_MS,
  });
  bindIo(io);

  // Authenticate the handshake before any connection is accepted.
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers.authorization?.startsWith('Bearer ')
        ? socket.handshake.headers.authorization.slice(7)
        : undefined);
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

  io.on('connection', async (socket) => {
    const userId = socket.data.userId as string;
    await socket.join(`user:${userId}`);
    registerSocket(socket, userId);
    logger.debug({ userId, socketId: socket.id }, 'socket connected');

    await presenceService.touchOnline(userId).catch((err) => logger.error({ err }, 'presence update failed'));
    await emitInitialPresence(userId);
    registerChatHandlers(socket, userId);
    registerCallHandlers(socket, userId);

    socket.on('disconnect', async (reason) => {
      unregisterSocket(socket);
      logger.debug({ userId, reason }, 'socket disconnected');
      // Only flip offline when the user has no remaining devices connected.
      const { isUserOnline, emitToUser } = await import('./socketState.js');
      if (!isUserOnline(userId)) {
        await presenceService.touchOffline(userId).catch(() => undefined);
        const pairing = await findActivePairing(userId).catch(() => null);
        if (pairing) {
          const partnerId = partnerIdOf(pairing, userId);
          emitToUser(partnerId, SocketEvents.PRESENCE_UPDATE, {
            userId,
            online: false,
            at: new Date().toISOString(),
          });
        }
      }
    });
  });

  return io;
}
