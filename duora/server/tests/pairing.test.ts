import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  pairingFindMany: vi.fn(),
  pairingCreate: vi.fn(),
  pairingUpdate: vi.fn(),
  invitationFindFirst: vi.fn(),
  invitationCreate: vi.fn(),
  invitationUpdate: vi.fn(),
  invitationUpdateMany: vi.fn(),
  conversationCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('../src/database/prisma', () => {
  const tx = {
    pairing: { create: mocks.pairingCreate, update: mocks.pairingUpdate },
    conversation: { create: mocks.conversationCreate },
    pairingInvitation: { update: mocks.invitationUpdate, updateMany: mocks.invitationUpdateMany },
  };
  return {
    prisma: {
      $transaction: mocks.transaction.mockImplementation((cb: (txClient: typeof tx) => unknown) => cb(tx)),
      pairing: { findMany: mocks.pairingFindMany, create: mocks.pairingCreate, update: mocks.pairingUpdate },
      pairingInvitation: {
        findFirst: mocks.invitationFindFirst,
        create: mocks.invitationCreate,
        update: mocks.invitationUpdate,
        updateMany: mocks.invitationUpdateMany,
      },
      conversation: { create: mocks.conversationCreate },
    },
  };
});

import * as pairingService from '../src/modules/pairing/pairing.service';
import { ApiError } from '../src/utils/ApiError';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.transaction.mockImplementation((cb: (txClient: unknown) => unknown) =>
    cb({
      pairing: { create: mocks.pairingCreate, update: mocks.pairingUpdate },
      conversation: { create: mocks.conversationCreate },
      pairingInvitation: { update: mocks.invitationUpdate, updateMany: mocks.invitationUpdateMany },
    }),
  );
});

describe('pairing service', () => {
  it('refuses a new invitation when the user is already paired', async () => {
    mocks.pairingFindMany.mockResolvedValueOnce([
      { id: 'p1', userAId: 'u1', userBId: 'u2', conversation: { id: 'c1' }, createdAt: new Date() },
    ]);
    await expect(pairingService.createInvitation('u1')).rejects.toMatchObject({ statusCode: 409 });
  });

  it('creates a short-lived invitation with a code and opaque token', async () => {
    mocks.pairingFindMany.mockResolvedValueOnce([]);
    mocks.invitationUpdateMany.mockResolvedValueOnce({ count: 0 });
    mocks.invitationCreate.mockResolvedValueOnce({
      id: 'inv1',
      code: 'DUO-123456',
      token: 'opaque-token',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 10 * 60_000),
      createdBy: { id: 'u1', displayName: 'Alice', avatarUrl: null },
    });

    const invitation = await pairingService.createInvitation('u1');

    expect(invitation.code).toMatch(/^DUO-\d{6}$/);
    expect(invitation.token).toBeTruthy();
    expect(invitation.createdBy.id).toBe('u1');
  });

  it('rejects an unknown code and increments attempts on each verification', async () => {
    mocks.invitationFindFirst.mockResolvedValueOnce(null);
    await expect(pairingService.verifyCode('u2', 'DUO-000000')).rejects.toBeInstanceOf(ApiError);

    const invitation = {
      id: 'inv1',
      code: 'DUO-123456',
      createdById: 'u1',
      attemptCount: 0,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 60_000),
      createdBy: { id: 'u1', displayName: 'Alice', avatarUrl: null },
    };
    mocks.invitationFindFirst.mockResolvedValueOnce(invitation);
    mocks.invitationUpdate.mockResolvedValueOnce({});
    const result = await pairingService.verifyCode('u2', 'DUO-123456');
    expect(result.code).toBe('DUO-123456');
    expect(mocks.invitationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { attemptCount: { increment: 1 } } }),
    );
  });

  it('locks the invitation after the attempt ceiling', async () => {
    mocks.invitationFindFirst.mockResolvedValueOnce({
      id: 'inv1',
      code: 'DUO-123456',
      createdById: 'u1',
      attemptCount: 5,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 60_000),
      createdBy: { id: 'u1' },
    });
    await expect(pairingService.verifyCode('u2', 'DUO-123456')).rejects.toMatchObject({ statusCode: 403 });
  });

  it('completes pairing server-side and creates the conversation atomically', async () => {
    mocks.pairingFindMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    mocks.invitationFindFirst.mockResolvedValueOnce({
      id: 'inv1',
      code: 'DUO-123456',
      token: 'tok',
      createdById: 'u1',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 60_000),
    });
    mocks.pairingCreate.mockResolvedValueOnce({ id: 'pair-1' });
    mocks.conversationCreate.mockResolvedValueOnce({ id: 'conv-1' });

    const result = await pairingService.acceptInvitation('u2', { code: 'DUO-123456' });

    expect(result).toEqual({ pairingId: 'pair-1', conversationId: 'conv-1', partnerId: 'u1' });
    expect(mocks.pairingCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userAId: 'u1', userBId: 'u2' }) }),
    );
    expect(mocks.invitationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'USED' }) }),
    );
  });

  it('refuses to accept an expired invitation', async () => {
    mocks.pairingFindMany.mockResolvedValueOnce([]);
    mocks.invitationFindFirst.mockResolvedValueOnce({
      id: 'inv1',
      createdById: 'u1',
      status: 'PENDING',
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(pairingService.acceptInvitation('u2', { code: 'DUO-123456' })).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('unpair requires an active pairing', async () => {
    mocks.pairingFindMany.mockResolvedValueOnce([]);
    await expect(pairingService.unpair('u1')).rejects.toMatchObject({ statusCode: 409 });
  });
});
