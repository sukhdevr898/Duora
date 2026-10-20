import type { NextFunction, Request, Response } from 'express';

// Wraps async route handlers so rejected promises reach the error middleware.
export function asyncHandler<TReq extends Request = Request>(
  fn: (req: TReq, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req as TReq, res, next).catch(next);
  };
}
