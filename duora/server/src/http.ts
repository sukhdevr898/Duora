/** Request validation plus the not-found and error handlers. */
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import type { ZodTypeAny } from 'zod';
import { logger } from './env';
import { ApiError } from './util';

type Source = 'body' | 'query' | 'params';

/** Validates and *replaces* the request segment with the parsed value. */
export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(result.error);
      return;
    }
    if (source === 'query') {
      // Express 5 exposes a getter-only query — assign to a parallel field.
      (req as Request & { validatedQuery?: unknown }).validatedQuery = result.data;
    } else {
      req[source] = result.data as never;
    }
    next();
  };
}

/** Reads the parsed query written by `validate(schema, 'query')`. */
export function validatedQuery<T>(req: Request): T {
  return (req as Request & { validatedQuery?: T }).validatedQuery as T;
}

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
