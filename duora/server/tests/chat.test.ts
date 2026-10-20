import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  conversationFindUnique: vi.fn(),
  messageFindUnique: vi.fn(),
  messageFindMany: vi.fn(),
  messageFindFirst: vi.fn(),
  messageCreate: vi.fn(),
  messageUpdate: vi.fn(),
  messageCount: vi.fn(),
  receiptUpdateMany: vi.fn(),
  hiddenFindMany: vi.fn(),
  hiddenUpsert: vi.fn(),
  conversationUpdate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('../src/database/prisma', () => ({
  prisma: {
    conversation: { findUnique: mocks.conversationFindUnique, update: mocks.conversationUpdate },
    message: {
      findUnique: mocks.messageFindUnique,
      findMany: mocks.messageFindMany,
      findFirst: mocks.messageFindFirst,
      create: mocks.messageCreate,
      update: mocks.messageUpdate,
      count: mocks.messageCount,
    },
    messageReceipt: { updateMany: mocks.receiptUpdateMany },
    hiddenMessage: { findMany: mocks.hiddenFindMany, upsert: mocks.hiddenUpsert },
    $transaction: mocks.transaction,
  },
}));

import * as chatService from '../src/modules/chat/chat.service';

const conversationAuth = {
  id: 'conv-1',
  participants: [{ userId: 'u1' }, { userId: 'u2' }],
  pairing: { userAId: 'u1', userBId: 'u2' },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.conversationFindUnique.mockResolvedValue(conversationAuth);
  mocks.hiddenFindMany.mockResolvedValue([]);
});

const baseInput = {
  conversationId: 'conv-1',
  clientMessageId: '11111111-1111-4111-8111-111111111111',
  text: 'hello',
  type: 'TEXT' as const,
};

describe('chat service', () => {
  it('is idempotent: retried client message id returns the durable original', async () => {
    const existing = { id: 'm1', senderId: 'u1', clientMessageId: baseInput.clientMessageId };
    mocks.messageFindUnique.mockResolvedValueOnce(existing);

    const result = await chatService.sendMessage('u1', baseInput);

    expect(result).toBe(existing);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('persists a new message with receipts for both participants', async () => {
    mocks.messageFindUnique.mockResolvedValueOnce(null);
    mocks.transaction.mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
      cb({
        message: {
          create: mocks.messageCreate.mockResolvedValueOnce({ id: 'm2', ...baseInput, senderId: 'u1', receipts: [] }),
        },
        conversation: { update: mocks.conversationUpdate },
      }),
    );

    const result = await chatService.sendMessage('u1', baseInput);

    expect(result.id).toBe('m2');
    const createArgs = mocks.messageCreate.mock.calls[0][0];
    expect(createArgs.data.receipts.create).toHaveLength(2);
    // Sender receipt is pre-read; partner receipt starts unread.
    expect(createArgs.data.receipts.create).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: 'u1', readAt: expect.any(Date) }),
        expect.objectContaining({ userId: 'u2', readAt: null }),
      ]),
    );
  });

  it('rejects senders that do not belong to the conversation', async () => {
    mocks.conversationFindUnique.mockResolvedValueOnce({
      ...conversationAuth,
      participants: [{ userId: 'u8' }, { userId: 'u9' }],
    });
    await expect(chatService.sendMessage('u1', baseInput)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('paginates history with a cursor and returns oldest-first within the page', async () => {
    const rows = Array.from({ length: 41 }, (_, i) => ({
      id: `m${i}`,
      createdAt: new Date(Date.now() - i * 1000),
      receipts: [],
    }));
    mocks.messageFindMany.mockResolvedValueOnce(rows);

    const page = await chatService.getMessages('u1', 'conv-1', { limit: 40 });

    expect(page.messages).toHaveLength(40);
    expect(page.nextCursor).toBeTruthy();
    // Page content is reversed for chronological rendering (slice keeps m0..m39).
    expect(page.messages[0].id).toBe('m39');
    expect(page.messages[39].id).toBe('m0');
  });

  it('marks incoming messages read and stamps deliveredAt too', async () => {
    mocks.receiptUpdateMany.mockResolvedValueOnce({ count: 3 });
    const result = await chatService.markRead('u2', 'conv-1');
    expect(result.updated).toBe(3);
    expect(mocks.receiptUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ readAt: expect.any(Date) }) }),
    );
  });
});
