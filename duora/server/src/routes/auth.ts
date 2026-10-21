/** Sign up, sign in, refresh, sign out and the current user. */
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { env } from '../env';
import { ApiError, id, nowIso, asyncHandler } from '../util';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken, requireAuth } from '../auth';
import { ensureSettings, findByEmail, findById, toPublicUser, type PublicUser, type UserRow } from './users';
import { Router } from 'express';
import { validate } from '../http';

export const registerSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Tell us your name').max(40),
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type AuthResult = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
};

const SALT_ROUNDS = 10;

export async function register(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<AuthResult> {
  const email = input.email.toLowerCase().trim();
  const existing = await findByEmail(email);
  if (existing) throw ApiError.conflict('That email is already registered');

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const now = nowIso();
  const userId = id('usr');

  await db().run(
    `INSERT INTO users (id, email, password_hash, display_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, email, passwordHash, input.displayName.trim(), now, now],
  );
  await ensureSettings(userId);

  const user = await findById(userId);
  if (!user) throw ApiError.internal('User could not be created');
  return issueTokens(user);
}

export async function login(input: { email: string; password: string }): Promise<AuthResult> {
  const user = await findByEmail(input.email.toLowerCase().trim());
  if (!user) throw ApiError.unauthorized('Email or password is wrong');
  const ok = await bcrypt.compare(input.password, user.password_hash);
  if (!ok) throw ApiError.unauthorized('Email or password is wrong');
  await ensureSettings(user.id);
  return issueTokens(user);
}

export async function refresh(refreshToken: string, meta: { userAgent?: string; ip?: string }): Promise<AuthResult> {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Refresh token is invalid or expired');
  }

  const session = await db().one<{ id: string; revoked_at: string | null; expires_at: string }>(
    'SELECT id, revoked_at, expires_at FROM refresh_sessions WHERE token_hash = ?',
    [hashToken(refreshToken)],
  );
  if (!session || session.revoked_at || new Date(session.expires_at) < new Date()) {
    throw ApiError.unauthorized('Refresh token is invalid or expired');
  }

  // Rotate — a refresh token is single use.
  await db().run('UPDATE refresh_sessions SET revoked_at = ? WHERE id = ?', [nowIso(), session.id]);

  const user = await findById(payload.sub);
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  return issueTokens(user, meta);
}

export async function logout(refreshToken: string): Promise<void> {
  await db().run('UPDATE refresh_sessions SET revoked_at = ? WHERE token_hash = ?', [
    nowIso(),
    hashToken(refreshToken),
  ]);
}

export async function me(userId: string): Promise<PublicUser> {
  const user = await findById(userId);
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  await ensureSettings(userId);
  return toPublicUser(user);
}

async function issueTokens(
  user: UserRow,
  meta: { userAgent?: string; ip?: string } = {},
): Promise<AuthResult> {
  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    displayName: user.display_name,
  });
  const refreshToken = signRefreshToken(user.id);
  const expiresAt = new Date(Date.now() + env.REFRESH_TTL_DAYS * 86_400_000).toISOString();

  await db().run(
    `INSERT INTO refresh_sessions (id, user_id, token_hash, user_agent, ip, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id('ses'), user.id, hashToken(refreshToken), meta.userAgent ?? null, meta.ip ?? null, expiresAt, nowIso()],
  );

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken,
    expiresIn: env.ACCESS_TTL,
  };
}

export const authRouter = Router();

authRouter.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await register(req.body as never);
    res.status(201).json(result);
  }),
);

authRouter.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await login(req.body as never);
    res.json(result);
  }),
);

authRouter.post(
  '/refresh',
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    const result = await refresh(
      (req.body as { refreshToken: string }).refreshToken,
      { userAgent: req.headers['user-agent'], ip: req.ip },
    );
    res.json(result);
  }),
);

authRouter.post(
  '/logout',
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    await logout((req.body as { refreshToken: string }).refreshToken);
    res.status(204).send();
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: await me(req.user!.id) });
  }),
);
