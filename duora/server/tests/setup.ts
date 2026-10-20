import { vi } from 'vitest';

// Runs before every test module so env validation passes without a real .env.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://duora:duora@localhost:5432/duora_test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-test-access-secret-0001';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-test-refresh-secret-0002';
process.env.PUBLIC_BASE_URL = 'http://localhost:4000';
process.env.LOG_LEVEL = 'silent';

// `@prisma/client` only exports the model enums after `prisma generate`, which
// downloads engine binaries (binaries.prisma.sh). Supply the literal values from
// prisma/schema.prisma as a fallback so `npm test` also runs in CI/sandboxes with
// no network. When a generated client IS present its real enums win (`actual.X ??`),
// so this never masks real Prisma behaviour. PrismaClient stays the real stub —
// every suite mocks ../src/database/prisma instead of instantiating it.
vi.mock('@prisma/client', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    PairingStatus: actual.PairingStatus ?? { ACTIVE: 'ACTIVE', UNLINKED: 'UNLINKED' },
    InvitationStatus: actual.InvitationStatus ?? {
      PENDING: 'PENDING',
      USED: 'USED',
      EXPIRED: 'EXPIRED',
      REVOKED: 'REVOKED',
    },
    MessageType: actual.MessageType ?? { TEXT: 'TEXT', ATTACHMENT: 'ATTACHMENT' },
    CallType: actual.CallType ?? { AUDIO: 'AUDIO', VIDEO: 'VIDEO' },
    CallStatus: actual.CallStatus ?? {
      RINGING: 'RINGING',
      CONNECTING: 'CONNECTING',
      ACTIVE: 'ACTIVE',
      ENDED: 'ENDED',
      DECLINED: 'DECLINED',
      CANCELLED: 'CANCELLED',
      MISSED: 'MISSED',
      FAILED: 'FAILED',
    },
  };
});
