import { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { ApiError } from '../../utils/ApiError';
import { authorizeConversation } from '../../services/relationship.service';
import type { SendMessageInput } from './chat.schema';

const messageInclude = {
  sender: { select: { id: true, displayName: true, avatarUrl: true } },
  replyTo: { select: { id: true, text: true, senderId: true, deletedForAllAt: true } },
  receipts: { select: { userId: true, deliveredAt: true, readAt: true } },
} satisfies Prisma.MessageInclude;

type MessageView = Prisma.MessageGetPayload<{ include: typeof messageInclude }>;

function present(message: MessageView, hiddenIds: Set<string>) {
  if (hiddenIds.has(message.id)) return null;
  if (message.deletedForAllAt) {
    return { ...message, text: '', attachmentUrl: null, attachmentMeta: null, deletedForAll: true };
  }
  return { ...message, deletedForAll: false };
}

export async function listConversations(userId: string) {
  const participations = await prisma.conversationParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          participants: { include: { user: { select: { id: true, displayName: true, avatarUrl: true } } } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      },
    },
  });

  return Promise.all(
    participations.map(async ({ conversation }) => {
      const partner = conversation.participants.find((p) => p.userId !== userId)?.user ?? null;
      const lastMessage = conversation.messages[0] ?? null;
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conversation.id,
          senderId: { not: userId },
          hiddenBy: { none: { userId } },
          receipts: { none: { userId, readAt: { not: null } } },
        },
      });
      return {
        id: conversation.id,
        updatedAt: conversation.updatedAt,
        partner,
        lastMessage,
        unreadCount,
      };
    }),
  );
}

export async function sendMessage(userId: string, input: SendMessageInput) {
  const auth = await authorizeConversation(userId, input.conversationId);

  if (input.type === 'ATTACHMENT' && !input.attachmentUrl) {
    throw ApiError.badRequest('Attachment messages require an attachmentUrl');
  }

  // Idempotency: a retried client message id returns the durable original.
  const existing = await prisma.message.findUnique({
    where: {
      conversationId_clientMessageId: {
        conversationId: input.conversationId,
        clientMessageId: input.clientMessageId,
      },
    },
    include: messageInclude,
  });
  if (existing) {
    if (existing.senderId !== userId) throw ApiError.forbidden('Client message id belongs to another sender');
    return existing;
  }

  if (input.replyToId) {
    const parent = await prisma.message.findFirst({
      where: { id: input.replyToId, conversationId: input.conversationId },
    });
    if (!parent) throw ApiError.badRequest('Reply target message not found');
  }

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        conversationId: input.conversationId,
        senderId: userId,
        clientMessageId: input.clientMessageId,
        text: input.text,
        type: input.type,
        attachmentUrl: input.attachmentUrl ?? null,
        attachmentMeta: (input.attachmentMeta ?? Prisma.JsonNull) as
          | Prisma.InputJsonValue
          | typeof Prisma.JsonNull,
        replyToId: input.replyToId ?? null,
        // Sender implicitly has read their own message; partner receipt starts empty.
        receipts: {
          create: auth.participantIds.map((participantId) => ({
            userId: participantId,
            readAt: participantId === userId ? new Date() : null,
            deliveredAt: participantId === userId ? new Date() : null,
          })),
        },
      },
      include: messageInclude,
    });
    await tx.conversation.update({
      where: { id: input.conversationId },
      data: { updatedAt: new Date() },
    });
    return created;
  });

  return message;
}

export async function getMessages(
  userId: string,
  conversationId: string,
  options: { cursor?: string; limit: number },
) {
  await authorizeConversation(userId, conversationId);

  const hidden = await prisma.hiddenMessage.findMany({
    where: { userId, message: { conversationId } },
    select: { messageId: true },
  });
  const hiddenIds = new Set(hidden.map((h) => h.messageId));

  const rows = await prisma.message.findMany({
    where: {
      conversationId,
      ...(options.cursor ? { createdAt: { lt: new Date(options.cursor) } } : {}),
      hiddenBy: { none: { userId } },
    },
    orderBy: { createdAt: 'desc' },
    take: options.limit + 1,
    include: messageInclude,
  });

  const hasMore = rows.length > options.limit;
  const page = hasMore ? rows.slice(0, options.limit) : rows;
  const messages = page.reverse().map((m) => present(m, hiddenIds)).filter((m): m is NonNullable<typeof m> => m !== null);

  return {
    messages,
    nextCursor: hasMore ? page[page.length - 1].createdAt.toISOString() : null,
  };
}

/** Reconnect reconciliation: everything new since the supplied timestamp. */
export async function syncSince(userId: string, conversationId: string, since: Date) {
  await authorizeConversation(userId, conversationId);
  const [messages, receipts] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId, createdAt: { gt: since }, hiddenBy: { none: { userId } } },
      orderBy: { createdAt: 'asc' },
      include: messageInclude,
    }),
    prisma.messageReceipt.findMany({
      where: { userId, readAt: { gt: since } },
      select: { messageId: true, readAt: true, deliveredAt: true },
    }),
  ]);
  return { messages, receipts };
}

export async function markDelivered(userId: string, conversationId: string): Promise<number> {
  await authorizeConversation(userId, conversationId);
  const result = await prisma.messageReceipt.updateMany({
    where: {
      userId,
      deliveredAt: null,
      message: { conversationId, senderId: { not: userId } },
    },
    data: { deliveredAt: new Date() },
  });
  return result.count;
}

export async function markRead(userId: string, conversationId: string, messageId?: string) {
  await authorizeConversation(userId, conversationId);
  const result = await prisma.messageReceipt.updateMany({
    where: {
      userId,
      readAt: null,
      message: {
        conversationId,
        senderId: { not: userId },
        ...(messageId ? { id: messageId } : {}),
      },
    },
    data: { readAt: new Date(), deliveredAt: new Date() },
  });
  return { updated: result.count, readAt: new Date() };
}

export async function deleteForMe(userId: string, messageId: string): Promise<void> {
  const message = await prisma.message.findFirst({ where: { id: messageId }, include: { conversation: true } });
  if (!message) throw ApiError.notFound('Message not found');
  await authorizeConversation(userId, message.conversationId);
  await prisma.hiddenMessage.upsert({
    where: { messageId_userId: { messageId, userId } },
    create: { messageId, userId },
    update: { hiddenAt: new Date() },
  });
}

export async function deleteForEveryone(userId: string, messageId: string): Promise<{ id: string; at: Date }> {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw ApiError.notFound('Message not found');
  if (message.senderId !== userId) throw ApiError.forbidden('Only the sender can delete this message for everyone');
  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { deletedForAllAt: new Date(), text: '', attachmentUrl: null, attachmentMeta: Prisma.JsonNull },
  });
  return { id: updated.id, at: updated.deletedForAllAt! };
}
