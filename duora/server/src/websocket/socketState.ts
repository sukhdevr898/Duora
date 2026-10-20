import type { Server, Socket } from 'socket.io';

// Process-local socket registry for the single-service deployment.
// Multi-instance deployments replace this with a Redis adapter (see docs).
interface SocketUser {
  userId: string;
  socketId: string;
}

let io: Server | null = null;
const socketsByUser = new Map<string, Set<string>>();

export function bindIo(server: Server): void {
  io = server;
}

export function registerSocket(socket: Socket, userId: string): void {
  (socket.data as SocketUser).userId = userId;
  let set = socketsByUser.get(userId);
  if (!set) {
    set = new Set();
    socketsByUser.set(userId, set);
  }
  set.add(socket.id);
}

export function unregisterSocket(socket: Socket): void {
  const userId = (socket.data as SocketUser).userId;
  if (!userId) return;
  const set = socketsByUser.get(userId);
  if (set) {
    set.delete(socket.id);
    if (set.size === 0) socketsByUser.delete(userId);
  }
}

export function isUserOnline(userId: string): boolean {
  return socketsByUser.has(userId);
}

export function onlineUserIds(userIds: string[]): Set<string> {
  return new Set(userIds.filter((id) => socketsByUser.has(id)));
}

/** Emits an event to all of a user's connected devices. No-op when offline. */
export function emitToUser(userId: string, event: string, payload: unknown): void {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

export function emitToUsers(userIds: string[], event: string, payload: unknown): void {
  for (const id of userIds) emitToUser(id, event, payload);
}
