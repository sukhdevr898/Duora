import type { Request } from 'express';

declare global {
  // Augment Express Request with the authenticated principal.
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export type AuthenticatedRequest = Request & {
  user: { id: string; email: string };
};
