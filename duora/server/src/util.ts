/**
 * Shared helpers: API errors, async route wrapper, ids and timestamps.
 * One file so the whole server is easy to read top to bottom.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { randomBytes, randomUUID } from 'node:crypto';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message = 'Bad request', details?: unknown) {
    return new ApiError(400, 'bad_request', message, details);
  }
  static unauthorized(message = 'Not authorised') {
    return new ApiError(401, 'unauthorized', message);
  }
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, 'forbidden', message);
  }
  static notFound(message = 'Not found') {
    return new ApiError(404, 'not_found', message);
  }
  static conflict(message = 'Already exists', details?: unknown) {
    return new ApiError(409, 'conflict', message, details);
  }
  static tooMany(message = 'Too many requests') {
    return new ApiError(429, 'rate_limited', message);
  }
  static internal(message = 'Something went wrong') {
    return new ApiError(500, 'internal_error', message);
  }
}

/** Wraps an async route so rejected promises reach the error middleware. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

/** Short, URL-safe, sortable-ish id. */
export function id(prefix = ''): string {
  const uuid = randomUUID().replace(/-/g, '');
  return prefix ? `${prefix}_${uuid.slice(0, 20)}` : uuid.slice(0, 24);
}

/** 6-character human pairing code without ambiguous glyphs (0/O, 1/I). */
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function pairingCode(length = 6): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

/** Opaque token embedded in the pairing QR payload. */
export function pairingToken(): string {
  return randomBytes(24).toString('base64url');
}

export const nowIso = (): string => new Date().toISOString();
