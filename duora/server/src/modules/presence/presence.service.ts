import { prisma } from '../../database/prisma';
import { isUserOnline } from '../../websocket/socketState';

export interface PresenceView {
  userId: string;
  online: boolean;
  lastSeenAt: string | null;
}

/** Reads presence for a user. Online means at least one live socket. */
export async function getPresence(userId: string): Promise<PresenceView> {
  const row = await prisma.presence.findUnique({ where: { userId } });
  return {
    userId,
    online: isUserOnline(userId),
    lastSeenAt: row?.lastSeenAt ? row.lastSeenAt.toISOString() : null,
  };
}

export async function touchOnline(userId: string): Promise<void> {
  await prisma.presence.upsert({
    where: { userId },
    create: { userId, online: true, lastSeenAt: new Date() },
    update: { online: true },
  });
}

export async function touchOffline(userId: string): Promise<void> {
  await prisma.presence.upsert({
    where: { userId },
    create: { userId, online: false, lastSeenAt: new Date() },
    update: { online: false, lastSeenAt: new Date() },
  });
}
