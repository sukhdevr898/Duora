import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  sessionCreate: vi.fn(),
  sessionUpdate: vi.fn(),
  sessionUpdateMany: vi.fn(),
  sessionFindUnique: vi.fn(),
}));

vi.mock('../src/database/prisma', () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique, create: mocks.userCreate },
    refreshSession: {
      create: mocks.sessionCreate,
      update: mocks.sessionUpdate,
      updateMany: mocks.sessionUpdateMany,
      findUnique: mocks.sessionFindUnique,
    },
  },
  connectPrisma: vi.fn(),
  disconnectPrisma: vi.fn(),
}));

import * as authService from '../src/modules/auth/auth.service';
import { ApiError } from '../src/utils/ApiError';

const meta = { userAgent: 'vitest', ip: '127.0.0.1' };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.sessionCreate.mockImplementation(async (args: { data: { userId: string } }) => ({
    id: 'session-1',
    userId: args.data.userId,
  }));
});

describe('auth service', () => {
  it('rejects registration when the email already exists', async () => {
    mocks.userFindUnique.mockResolvedValueOnce({ id: 'u1' });
    await expect(
      authService.register(
        { email: 'taken@duora.dev', password: 'Password123!', displayName: 'A' },
        meta,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('registers a new user with a hashed password and returns tokens', async () => {
    mocks.userFindUnique.mockResolvedValueOnce(null);
    mocks.userCreate.mockImplementation(async ({ data }: { data: { email: string; passwordHash: string } }) => ({
      id: 'u-new',
      email: data.email,
      displayName: 'New',
      avatarUrl: null,
      passwordHash: data.passwordHash,
    }));

    const result = await authService.register(
      { email: 'new@duora.dev', password: 'Password123!', displayName: 'New' },
      meta,
    );

    expect(result.tokens.accessToken).toMatch(/^eyJ/);
    expect(result.tokens.refreshToken).toBeTruthy();
    expect(mocks.userCreate).toHaveBeenCalledOnce();
    const storedHash = mocks.userCreate.mock.calls[0][0].data.passwordHash;
    await expect(bcrypt.compare('Password123!', storedHash)).resolves.toBe(true);
  });

  it('rejects login with a wrong password', async () => {
    const hash = await bcrypt.hash('correct-pass', 12);
    mocks.userFindUnique.mockResolvedValueOnce({
      id: 'u1',
      email: 'alice@duora.dev',
      displayName: 'Alice',
      avatarUrl: null,
      passwordHash: hash,
      deletedAt: null,
    });

    await expect(
      authService.login({ email: 'alice@duora.dev', password: 'wrong-pass' }, meta),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rotates refresh sessions: old session revoked, new one issued', async () => {
    mocks.sessionFindUnique.mockResolvedValueOnce({
      id: 'old-session',
      tokenHash: 'hash',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 10_000),
      userAgent: 'vitest',
      ip: '127.0.0.1',
      user: { id: 'u1', email: 'alice@duora.dev', deletedAt: null },
    });
    mocks.sessionUpdate.mockResolvedValueOnce({});

    const tokens = await authService.refresh('raw-refresh-token');

    expect(tokens.accessToken).toBeTruthy();
    expect(mocks.sessionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'old-session' }, data: { revokedAt: expect.any(Date) } }),
    );
  });

  it('rejects refresh when the session was revoked', async () => {
    mocks.sessionFindUnique.mockResolvedValueOnce({
      id: 'revoked',
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 10_000),
    });
    await expect(authService.refresh('raw')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('logout revokes the presented refresh session', async () => {
    mocks.sessionUpdateMany.mockResolvedValueOnce({ count: 1 });
    await authService.logout('raw-refresh-token');
    expect(mocks.sessionUpdateMany).toHaveBeenCalledOnce();
  });
});
