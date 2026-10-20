import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { opaqueToken, sha256 } from '../../utils/ids';
import { signAccessToken } from '../../middleware/auth.middleware';
import { logger } from '../../config/logger';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResult {
  user: Pick<User, 'id' | 'email' | 'displayName' | 'avatarUrl'>;
  tokens: AuthTokens;
}

function publicUser(user: User): AuthResult['user'] {
  return { id: user.id, email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl };
}

async function issueTokens(user: User, userAgent?: string, ip?: string): Promise<AuthTokens> {
  const refreshToken = opaqueToken(32);
  await prisma.refreshSession.create({
    data: {
      userId: user.id,
      tokenHash: sha256(refreshToken),
      userAgent: userAgent ?? null,
      ip: ip ?? null,
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  return {
    accessToken: signAccessToken({ sub: user.id, email: user.email }),
    refreshToken,
    expiresIn: env.ACCESS_TOKEN_TTL,
  };
}

export async function register(
  input: { email: string; password: string; displayName: string },
  meta: { userAgent?: string; ip?: string },
): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      displayName: input.displayName,
      settings: { create: {} },
    },
  });
  return { user: publicUser(user), tokens: await issueTokens(user, meta.userAgent, meta.ip) };
}

export async function login(
  input: { email: string; password: string },
  meta: { userAgent?: string; ip?: string },
): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // Same generic error whether the email or password is wrong (no account enumeration)
  if (!user || user.deletedAt) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  return { user: publicUser(user), tokens: await issueTokens(user, meta.userAgent, meta.ip) };
}

export async function refresh(rawRefreshToken: string): Promise<AuthTokens> {
  const tokenHash = sha256(rawRefreshToken);
  const session = await prisma.refreshSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!session || session.revokedAt) {
    throw ApiError.unauthorized('Refresh session not found or revoked');
  }
  if (session.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh session expired');
  }
  if (session.user.deletedAt) {
    throw ApiError.forbidden('Account is closed');
  }
  // Rotation: revoke the presented session and mint a fresh one.
  await prisma.refreshSession.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });
  return issueTokens(session.user, session.userAgent ?? undefined, session.ip ?? undefined);
}

export async function logout(rawRefreshToken: string): Promise<void> {
  await prisma.refreshSession.updateMany({
    where: { tokenHash: sha256(rawRefreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Password reset request. The response is identical whether or not the account
 * exists (no account enumeration). Delivering the email requires an SMTP/email
 * provider, which is intentionally not bundled in this deployment; until one is
 * configured the request is validated and logged.
 */
export async function requestPasswordReset(email: string): Promise<{ accepted: true }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    logger.info({ userId: user.id }, 'Password reset requested (email transport not configured)');
  }
  return { accepted: true };
}

export async function getMe(userId: string): Promise<AuthResult['user']> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) {
    throw ApiError.notFound('Account not found');
  }
  return publicUser(user);
}
