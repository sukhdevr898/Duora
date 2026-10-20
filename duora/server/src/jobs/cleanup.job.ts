import { CallStatus, InvitationStatus } from '@prisma/client';
import { prisma } from '../database/prisma';
import { logger } from '../config/logger';

// Lightweight personal use: run every 5 minutes instead of 60s to save DB + wakeups on Render free tier.
// RING_GRACE stays 90s — missed-call detection still happens on the next tick.
const TICK_MS = 5 * 60_000;
const RING_GRACE_MS = 90_000;

/**
 * Periodic maintenance:
 *  - ringing calls never answered become MISSED
 *  - expired pairing invitations are marked EXPIRED
 *  - expired refresh sessions are deleted
 */
export async function runCleanup(): Promise<void> {
  const now = new Date();
  const [missed, invitations, sessions] = await Promise.all([
    prisma.callSession.updateMany({
      where: { status: CallStatus.RINGING, createdAt: { lt: new Date(now.getTime() - RING_GRACE_MS) } },
      data: { status: CallStatus.MISSED, endedAt: now, endReason: 'no_answer' },
    }),
    prisma.pairingInvitation.updateMany({
      where: { status: InvitationStatus.PENDING, expiresAt: { lt: now } },
      data: { status: InvitationStatus.EXPIRED },
    }),
    prisma.refreshSession.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);
  if (missed.count || invitations.count || sessions.count) {
    logger.info({ missed: missed.count, invitations: invitations.count, sessions: sessions.count }, 'cleanup tick');
  }
}

export function startCleanupJobs(): NodeJS.Timeout {
  // Unref so the timer never keeps the process alive on its own.
  const timer = setInterval(() => {
    runCleanup().catch((err) => logger.error({ err }, 'cleanup job failed'));
  }, TICK_MS);
  timer.unref();
  return timer;
}

export function stopCleanupJobs(timer: NodeJS.Timeout): void {
  clearInterval(timer);
}
