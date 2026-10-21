import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/jwt';

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
