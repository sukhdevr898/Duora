import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  type: 'access';
}

export function signAccessToken(payload: { sub: string; email: string }): string {
  const options: jwt.SignOptions = { expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'] };
  return jwt.sign({ sub: payload.sub, email: payload.email, type: 'access' }, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    if (decoded.type !== 'access') {
      throw new Error('wrong token type');
    }
    return decoded;
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token');
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing bearer token');
  }
  const token = header.slice('Bearer '.length).trim();
  const payload = verifyAccessToken(token);
  // Sender identity always derives from the verified token, never the body.
  req.user = { id: payload.sub, email: payload.email };
  next();
}
