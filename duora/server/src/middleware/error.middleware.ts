import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { ApiError } from '../utils/ApiError';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { code: 'not_found', message: `No route for ${req.method} ${req.path}` },
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Request payload failed validation',
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof ApiError) {
    if (err.status >= 500) logger.error({ err: err.message, code: err.code }, 'api error');
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Unknown error';
  logger.error({ err: message, stack: err instanceof Error ? err.stack : undefined }, 'unhandled error');
  res.status(500).json({ error: { code: 'internal_error', message: 'Something went wrong' } });
}
