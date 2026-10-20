import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { prisma } from '../src/database/prisma';
import { logger } from '../src/config/logger';

/**
 * Development seed: creates a paired demo couple with a short conversation.
 * Safe to re-run — existing demo accounts are left untouched.
 */
async function main(): Promise<void> {
  const password = await bcrypt.hash('Password123!', 12);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@duora.dev' },
    update: {},
    create: {
      email: 'alice@duora.dev',
      passwordHash: password,
      displayName: 'Alice',
      settings: { create: {} },
      presence: { create: { online: false } },
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@duora.dev' },
    update: {},
    create: {
      email: 'bob@duora.dev',
      passwordHash: password,
      displayName: 'Bob',
      settings: { create: {} },
      presence: { create: { online: false } },
    },
  });

  const existingPairing = await prisma.pairing.findFirst({
    where: { status: 'ACTIVE', OR: [{ userAId: alice.id }, { userBId: alice.id }] },
  });

  if (!existingPairing) {
    const pairing = await prisma.pairing.create({
      data: { userAId: alice.id, userBId: bob.id },
    });
    const conversation = await prisma.conversation.create({
      data: {
        pairingId: pairing.id,
        participants: { create: [{ userId: alice.id }, { userId: bob.id }] },
      },
    });
    const first = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: alice.id,
        clientMessageId: randomUUID(),
        text: 'Two hearts. One private space. ❤',
        receipts: {
          create: [
            { userId: alice.id, readAt: new Date(), deliveredAt: new Date() },
            { userId: bob.id, readAt: new Date(), deliveredAt: new Date() },
          ],
        },
      },
    });
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: bob.id,
        clientMessageId: randomUUID(),
        text: 'Just us. Always.',
        replyToId: first.id,
        receipts: {
          create: [
            { userId: bob.id, readAt: new Date(), deliveredAt: new Date() },
            { userId: alice.id },
          ],
        },
      },
    });
  }

  logger.info('Seed complete: alice@duora.dev / bob@duora.dev (password: Password123!)');
}

main()
  .catch((err) => {
    logger.error({ err }, 'Seed failed');
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
