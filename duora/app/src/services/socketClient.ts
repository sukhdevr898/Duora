import { io, type Socket } from 'socket.io-client';
import { config } from '../constants/config';
import { getAuthSnapshot } from '../state/auth.store';
import { useNetworkStore } from '../state/network.store';
import { logger } from '../utils/logger';

let socket: Socket | null = null;

/**
 * Opens the authenticated WebSocket. The access token is sent in the handshake;
 * the server rejects the connection when it is missing or invalid.
 */
export function connectSocket(): Socket | null {
  const token = getAuthSnapshot().tokens?.accessToken;
  if (!token) {
    logger.warn('socket', 'connect called without an access token');
    return null;
  }
  if (socket?.connected) return socket;
  if (socket) socket.disconnect();

  socket = io(config.wsUrl, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 15_000,
    timeout: 15_000,
  });

  const net = useNetworkStore.getState();
  socket.on('connect', () => {
    logger.info('socket', `connected ${socket?.id ?? ''}`);
    net.setSocketState('connected');
  });
  socket.on('disconnect', (reason) => {
    logger.warn('socket', `disconnected: ${reason}`);
    net.setSocketState('disconnected');
  });
  socket.on('connect_error', (err) => {
    logger.warn('socket', 'connect error', err.message);
    useNetworkStore.getState().setSocketState('connecting');
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
  useNetworkStore.getState().setSocketState('disconnected');
}

/** Promise wrapper around Socket.IO acknowledgements with a timeout. */
export function emitWithAck<T>(event: string, payload: unknown, timeoutMs = 10_000): Promise<T> {
  const active = socket;
  if (!active) return Promise.reject(new Error('socket_not_connected'));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('socket_ack_timeout')), timeoutMs);
    active.timeout(timeoutMs).emit(event, payload, (err: unknown, response: T) => {
      clearTimeout(timer);
      if (err) reject(err instanceof Error ? err : new Error(JSON.stringify(err)));
      else resolve(response);
    });
  });
}
