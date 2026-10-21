import jwt, { type SignOptions } from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import { env } from '../config/env';

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

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.REFRESH_TTL_DAYS}d`,
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
