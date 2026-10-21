import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

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
