import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as authService from './auth.service';
import { loginSchema, refreshSchema, registerSchema } from './auth.schema';

export const authRouter = Router();

authRouter.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body as never);
    res.status(201).json(result);
  }),
);

authRouter.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body as never);
    res.json(result);
  }),
);

authRouter.post(
  '/refresh',
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.refresh(
      (req.body as { refreshToken: string }).refreshToken,
      { userAgent: req.headers['user-agent'], ip: req.ip },
    );
    res.json(result);
  }),
);

authRouter.post(
  '/logout',
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    await authService.logout((req.body as { refreshToken: string }).refreshToken);
    res.status(204).send();
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: await authService.me(req.user!.id) });
  }),
);
