/** Tokens (JWT) and the `requireAuth` guard. */
import jwt, { type SignOptions } from 'jsonwebtoken';
import { createHash, randomUUID } from 'node:crypto';
import { env } from './env';
import type { NextFunction, Request, Response } from 'express';
import { ApiError } from './util';

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

/** Bearer-token guard for protected routes. */
export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    next(ApiError.unauthorized('Missing bearer token'));
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, displayName: payload.displayName };
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}

/** Attaches the user when a valid token is present, but never rejects. */
export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme === 'Bearer' && token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub, email: payload.email, displayName: payload.displayName };
    } catch {
      /* ignore — treated as anonymous */
    }
  }
  next();
}
