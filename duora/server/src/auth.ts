/** Tokens (JWT) and the `requireAuth` guard. */
import jwt, { type SignOptions } from 'jsonwebtoken';
import { createHash, randomUUID } from 'node:crypto';
import { env } from './env';
import type { NextFunction, Request, Response } from 'express';
import { ApiError } from './util';
import { supabaseEnabled, verifySupabaseToken } from './supabase';
import { createUser, findByEmail, type UserRow } from './users';

export type AccessPayload = {
  sub: string;
  email: string;
  displayName: string;
  type: 'access';
};

export function signAccessToken(user: { id: string; email: string; displayName: string }): string {
  const payload: AccessPayload = {
    sub: user.id,
    email: user.email,
    displayName: user.displayName,
    type: 'access',
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TTL } as SignOptions);
}

/**
 * Every refresh token carries a random id.
 *
 * Without it two tokens signed inside the same second would be byte identical
 * (the JWT `iat` claim only has second precision) and the second insert into
 * `refresh_sessions` would fail on the unique token hash.
 */
export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.REFRESH_TTL_DAYS}d`,
    jwtid: randomUUID(),
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
  if (decoded.type !== 'access') throw new Error('wrong token type');
  return decoded;
}

export function verifyRefreshToken(token: string): { sub: string } {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string; type: string };
  if (decoded.type !== 'refresh') throw new Error('wrong token type');
  return decoded;
}

/** Refresh tokens are stored hashed — the raw token never touches the DB. */
export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

export interface AuthedRequest extends Request {
  user?: { id: string; email: string; displayName: string };
}

function bearerToken(req: Request): string | null {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

/**
 * Bearer-token guard for protected routes.
 *
 * Accepts a Duora access token **or** a Supabase access token (verified with
 * the project's JWKS). A Supabase user is matched to the local account by
 * email and created on the fly when it does not exist yet.
 */
export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const token = bearerToken(req);
  if (!token) {
    next(ApiError.unauthorized('Missing bearer token'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, displayName: payload.displayName };
    next();
    return;
  } catch {
    /* not one of ours — try Supabase below */
  }

  if (!supabaseEnabled()) {
    next(ApiError.unauthorized('Invalid or expired token'));
    return;
  }

  void verifySupabaseToken(token)
    .then((supabaseUser) => {
      if (!supabaseUser) {
        next(ApiError.unauthorized('Invalid or expired token'));
        return;
      }
      return resolveLocalUser(supabaseUser.email, supabaseUser.displayName).then((user) => {
        req.user = { id: user.id, email: user.email, displayName: user.display_name };
        next();
      });
    })
    .catch(() => next(ApiError.unauthorized('Invalid or expired token')));
}

/**
 * Finds the local account for a Supabase user. When the account does not exist
 * yet it is created — Supabase becomes the identity provider and Duora keeps
 * the profile, the conversation and everything else.
 */
async function resolveLocalUser(email: string, displayName: string): Promise<UserRow> {
  if (email) {
    const existing = await findByEmail(email);
    if (existing) return existing;
  }
  return createUser({
    email: email || `${Date.now()}@supabase.local`,
    passwordHash: 'supabase',
    displayName: displayName || 'Partner',
  });
}

/** Attaches the user when a valid token is present, but never rejects. */
export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const token = bearerToken(req);
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub, email: payload.email, displayName: payload.displayName };
    } catch {
      /* ignore — treated as anonymous */
    }
  }
  next();
}
